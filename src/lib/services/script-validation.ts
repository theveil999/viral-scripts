/**
 * @fileoverview script-validation service
 * @module lib/services/script-validation
 */
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/admin'
import { buildValidationPrompt } from '../prompts/script-validation'
import type { TransformedScript } from './voice-transformation'
import type { VoiceProfile } from '../supabase/types'

// Lazy initialization for Anthropic client
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// Types
export type Verdict = 'PASS' | 'REVISE' | 'FAIL'
export type RevisionPriority = 'none' | 'low' | 'medium' | 'high'

export interface ValidationResult {
  script_index: number
  voice_fidelity_score: number
  ai_tells_found: string[]
  boundary_violations: string[]
  strengths: string[]
  improvements: string[]
  verdict: Verdict
  revision_priority: RevisionPriority
}

export interface ValidationSummary {
  total: number
  passed: number
  needs_revision: number
  failed: number
  avg_fidelity_score: number
  common_issues: string[]
}

export interface ValidationBatchResult {
  model_id: string
  validations: ValidationResult[]
  summary: ValidationSummary
  validation_time_ms: number
  tokens_used: number
}

/**
 * Parse JSON response from Claude, handling markdown code fences
 */
function parseValidationResponse(text: string): ValidationResult[] {
  let jsonText = text.trim()

  // Remove markdown code fences
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7)
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3)
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3)
  }
  jsonText = jsonText.trim()

  const results = JSON.parse(jsonText) as ValidationResult[]

  if (!Array.isArray(results)) {
    throw new Error('Response is not an array')
  }

  return results
}

/**
 * Process and normalize validation result
 */
function processValidationResult(result: ValidationResult): ValidationResult {
  // Normalize verdict
  let verdict: Verdict = 'REVISE'
  if (result.verdict === 'PASS' || result.verdict === 'REVISE' || result.verdict === 'FAIL') {
    verdict = result.verdict
  } else if (result.voice_fidelity_score >= 80 && (!result.boundary_violations || result.boundary_violations.length === 0)) {
    verdict = 'PASS'
  } else if (result.voice_fidelity_score < 60 || (result.boundary_violations && result.boundary_violations.length > 0)) {
    verdict = 'FAIL'
  }

  // Normalize priority
  let priority: RevisionPriority = 'none'
  if (result.revision_priority === 'none' || result.revision_priority === 'low' ||
      result.revision_priority === 'medium' || result.revision_priority === 'high') {
    priority = result.revision_priority
  } else if (verdict === 'PASS') {
    priority = 'none'
  } else if (verdict === 'REVISE') {
    priority = result.voice_fidelity_score >= 75 ? 'low' : 'medium'
  } else {
    priority = 'high'
  }

  return {
    script_index: result.script_index || 0,
    voice_fidelity_score: typeof result.voice_fidelity_score === 'number'
      ? Math.min(100, Math.max(0, result.voice_fidelity_score))
      : 0,
    ai_tells_found: Array.isArray(result.ai_tells_found) ? result.ai_tells_found : [],
    boundary_violations: Array.isArray(result.boundary_violations) ? result.boundary_violations : [],
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    verdict,
    revision_priority: priority,
  }
}

/**
 * Calculate summary statistics from validation results
 */
function calculateSummary(validations: ValidationResult[]): ValidationSummary {
  const total = validations.length
  const passed = validations.filter((v) => v.verdict === 'PASS').length
  const needsRevision = validations.filter((v) => v.verdict === 'REVISE').length
  const failed = validations.filter((v) => v.verdict === 'FAIL').length

  const avgFidelity = total > 0
    ? Math.round(validations.reduce((sum, v) => sum + v.voice_fidelity_score, 0) / total)
    : 0

  // Find common issues across all validations
  const issueCount = new Map<string, number>()
  for (const v of validations) {
    for (const tell of v.ai_tells_found) {
      // Normalize issue names
      const normalized = tell.toLowerCase().replace(/in sentence \d+/g, '').trim()
      issueCount.set(normalized, (issueCount.get(normalized) || 0) + 1)
    }
    for (const improvement of v.improvements) {
      issueCount.set(improvement, (issueCount.get(improvement) || 0) + 1)
    }
  }

  // Get top issues
  const commonIssues = Array.from(issueCount.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue)

  return {
    total,
    passed,
    needs_revision: needsRevision,
    failed,
    avg_fidelity_score: avgFidelity,
    common_issues: commonIssues,
  }
}

/**
 * Validate transformed scripts using Claude Haiku
 * Fast and cheap quality check before saving to database
 */
export async function validateScripts(
  modelId: string,
  scripts: TransformedScript[]
): Promise<ValidationBatchResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  // Fetch model with voice profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: model, error: modelError } = await (supabase
    .from('models') as any)
    .select('id, name, voice_profile')
    .eq('id', modelId)
    .single()

  if (modelError || !model) {
    throw new Error(`Failed to fetch model ${modelId}: ${modelError?.message || 'Not found'}`)
  }

  const voiceProfile = model.voice_profile as VoiceProfile

  if (!voiceProfile) {
    throw new Error(`Model ${modelId} has no voice profile`)
  }

  // Build validation prompt
  const prompt = buildValidationPrompt({
    modelName: model.name,
    voiceProfile,
    scripts,
  })

  // Call Claude Haiku for fast validation
  const response = await getAnthropicClient().messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    temperature: 0.3, // Low temperature for consistent scoring
    messages: [{ role: 'user', content: prompt }],
  })

  const tokensUsed = response.usage?.output_tokens || 0

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  // Parse and process results
  const rawResults = parseValidationResponse(content.text)
  const validations = rawResults.map(processValidationResult)

  // Adjust indices if needed
  for (let i = 0; i < validations.length; i++) {
    if (validations[i].script_index === 0 && i > 0) {
      validations[i].script_index = i
    }
  }

  const summary = calculateSummary(validations)
  const validationTime = Date.now() - startTime

  return {
    model_id: modelId,
    validations,
    summary,
    validation_time_ms: validationTime,
    tokens_used: tokensUsed,
  }
}

/**
 * Filter to only scripts with PASS verdict
 */
export function getPassingScripts(
  scripts: TransformedScript[],
  validations: ValidationResult[]
): TransformedScript[] {
  const passingIndices = new Set(
    validations
      .filter((v) => v.verdict === 'PASS')
      .map((v) => v.script_index)
  )

  return scripts.filter((_, index) => passingIndices.has(index))
}

/**
 * Get scripts that need revision paired with their validation feedback
 */
export function getScriptsNeedingRevision(
  scripts: TransformedScript[],
  validations: ValidationResult[]
): Array<{ script: TransformedScript; validation: ValidationResult }> {
  const reviseValidations = validations.filter((v) => v.verdict === 'REVISE')

  return reviseValidations.map((validation) => ({
    script: scripts[validation.script_index],
    validation,
  })).filter((item) => item.script !== undefined)
}

/**
 * Get scripts that failed validation
 */
export function getFailedScripts(
  scripts: TransformedScript[],
  validations: ValidationResult[]
): Array<{ script: TransformedScript; validation: ValidationResult }> {
  const failedValidations = validations.filter((v) => v.verdict === 'FAIL')

  return failedValidations.map((validation) => ({
    script: scripts[validation.script_index],
    validation,
  })).filter((item) => item.script !== undefined)
}
