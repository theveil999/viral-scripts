/**
 * @fileoverview script-expansion service
 * @module lib/services/script-expansion
 */
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/admin'
import { retrieveRelevantCorpus } from './corpus-retrieval'
import { buildScriptExpansionPrompt, DURATION_GUIDELINES, type TargetDuration, type OrganicCtaType } from '../prompts/script-expansion'
import type { GeneratedHook } from './hook-generation'
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
export interface StructureBreakdown {
  hook: string
  tension: string
  payload: string
  closer: string
}

export interface ExpandedScript {
  hook_index: number
  hook: string
  script: string
  word_count: number
  estimated_duration_seconds: number
  structure_breakdown: StructureBreakdown
  parasocial_levers_used: string[]
  voice_elements_used: string[]
  quality_score?: number
  validation_issues?: string[]
  // Kane Framework additions
  cta_type?: OrganicCtaType
}

export interface ScriptExpansionOptions {
  targetDuration?: TargetDuration
  corpusLimit?: number
  batchSize?: number
  temperature?: number
  // Kane Framework additions
  ctaType?: OrganicCtaType | 'auto'
}

export interface ScriptExpansionResult {
  model_id: string
  scripts: ExpandedScript[]
  expansion_stats: {
    hooks_received: number
    scripts_generated: number
    avg_word_count: number
    avg_duration_seconds: number
    generation_time_ms: number
    tokens_used: number
  }
}

export interface ValidationResult {
  valid: boolean
  issues: string[]
}

/**
 * Parse JSON response from Claude, handling markdown code fences
 */
function parseScriptsResponse(text: string): ExpandedScript[] {
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

  const scripts = JSON.parse(jsonText) as ExpandedScript[]

  if (!Array.isArray(scripts)) {
    throw new Error('Response is not an array')
  }

  return scripts
}

/**
 * Validate a single expanded script
 */
export function validateScript(
  script: ExpandedScript,
  voiceProfile: VoiceProfile,
  targetDuration: TargetDuration
): ValidationResult {
  const issues: string[] = []
  const duration = DURATION_GUIDELINES[targetDuration]

  // Parse word count range
  const [minWords, maxWords] = duration.words.split('-').map(Number)

  // Check word count
  if (script.word_count < minWords - 10) {
    issues.push(`Script too short: ${script.word_count} words (target: ${duration.words})`)
  }
  if (script.word_count > maxWords + 20) {
    issues.push(`Script too long: ${script.word_count} words (target: ${duration.words})`)
  }

  // Check that script starts with (or contains) the hook
  const hookNormalized = script.hook.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const scriptStart = script.script.slice(0, 200).toLowerCase().replace(/[^a-z0-9\s]/g, '')
  if (!scriptStart.includes(hookNormalized.slice(0, 30))) {
    issues.push('Script may not start with the hook')
  }

  // Check for hard_nos
  const boundaries = voiceProfile.boundaries as Record<string, unknown>
  const hardNos = (boundaries?.hard_nos as string[]) || []
  for (const hardNo of hardNos) {
    if (script.script.toLowerCase().includes(hardNo.toLowerCase())) {
      issues.push(`Contains hard no: "${hardNo}"`)
    }
  }

  // Check for topics_to_avoid
  const topicsToAvoid = (boundaries?.topics_to_avoid as string[]) || []
  for (const topic of topicsToAvoid) {
    if (script.script.toLowerCase().includes(topic.toLowerCase())) {
      issues.push(`Contains topic to avoid: "${topic}"`)
    }
  }

  // Check structure components exist
  if (!script.structure_breakdown) {
    issues.push('Missing structure_breakdown')
  } else {
    if (!script.structure_breakdown.hook) issues.push('Missing structure: hook')
    if (!script.structure_breakdown.tension) issues.push('Missing structure: tension')
    if (!script.structure_breakdown.payload) issues.push('Missing structure: payload')
    if (!script.structure_breakdown.closer) issues.push('Missing structure: closer')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Clean and validate scripts
 */
function processScripts(
  scripts: ExpandedScript[],
  voiceProfile: VoiceProfile,
  targetDuration: TargetDuration
): ExpandedScript[] {
  return scripts.map((script) => {
    // Ensure required fields
    const processed: ExpandedScript = {
      hook_index: script.hook_index || 0,
      hook: script.hook || '',
      script: script.script || '',
      word_count: script.word_count || script.script?.split(/\s+/).length || 0,
      estimated_duration_seconds: script.estimated_duration_seconds || DURATION_GUIDELINES[targetDuration].seconds,
      structure_breakdown: script.structure_breakdown || {
        hook: '',
        tension: '',
        payload: '',
        closer: '',
      },
      parasocial_levers_used: Array.isArray(script.parasocial_levers_used)
        ? script.parasocial_levers_used
        : [],
      voice_elements_used: Array.isArray(script.voice_elements_used)
        ? script.voice_elements_used
        : [],
      // Kane Framework: preserve CTA type from LLM response
      cta_type: script.cta_type as OrganicCtaType | undefined,
    }

    // Validate
    const validation = validateScript(processed, voiceProfile, targetDuration)
    if (!validation.valid) {
      processed.validation_issues = validation.issues
    }

    return processed
  })
}

/**
 * Expand hooks into full scripts
 */
export async function expandScripts(
  modelId: string,
  hooks: GeneratedHook[],
  options: ScriptExpansionOptions = {}
): Promise<ScriptExpansionResult> {
  const {
    targetDuration = 'medium',
    corpusLimit = 10,
    batchSize = 10,
    temperature = 0.8,
    ctaType = 'auto',
  } = options

  const startTime = Date.now()
  const supabase = createAdminClient()

  // Step 1: Fetch model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: model, error: modelError } = await (supabase
    .from('models') as any)
    .select('id, name, voice_profile, embedding')
    .eq('id', modelId)
    .single()

  if (modelError || !model) {
    throw new Error(`Failed to fetch model ${modelId}: ${modelError?.message || 'Not found'}`)
  }

  const voiceProfile = model.voice_profile as VoiceProfile

  // Step 2: Get corpus examples for structure reference
  let corpusExamples: Awaited<ReturnType<typeof retrieveRelevantCorpus>>['matches'] = []

  if (model.embedding) {
    try {
      const corpusResult = await retrieveRelevantCorpus(modelId, { limit: corpusLimit })
      corpusExamples = corpusResult.matches
    } catch (err) {
      console.warn('Failed to retrieve corpus examples:', err)
    }
  }

  // Step 3: Batch hooks and process
  const allScripts: ExpandedScript[] = []
  let totalTokens = 0

  for (let i = 0; i < hooks.length; i += batchSize) {
    const batch = hooks.slice(i, i + batchSize)

    // Build prompt for batch
    const prompt = buildScriptExpansionPrompt({
      modelName: model.name,
      voiceProfile,
      hooks: batch,
      corpusExamples,
      targetDuration,
      ctaType,
    })

    // Call Claude API
    try {
      const response = await getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      })

      totalTokens += response.usage?.output_tokens || 0

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const scripts = parseScriptsResponse(content.text)
      const processed = processScripts(scripts, voiceProfile, targetDuration)

      // Adjust hook_index for batch offset
      for (const script of processed) {
        script.hook_index = script.hook_index + i
      }

      allScripts.push(...processed)
    } catch (err) {
      console.error(`Batch ${i / batchSize + 1} expansion failed:`, err)
      // Continue with other batches
    }

    // Small delay between batches
    if (i + batchSize < hooks.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Step 4: Calculate stats
  const generationTime = Date.now() - startTime
  const avgWordCount = allScripts.length > 0
    ? Math.round(allScripts.reduce((sum, s) => sum + s.word_count, 0) / allScripts.length)
    : 0
  const avgDuration = allScripts.length > 0
    ? Math.round(allScripts.reduce((sum, s) => sum + s.estimated_duration_seconds, 0) / allScripts.length)
    : 0

  return {
    model_id: modelId,
    scripts: allScripts,
    expansion_stats: {
      hooks_received: hooks.length,
      scripts_generated: allScripts.length,
      avg_word_count: avgWordCount,
      avg_duration_seconds: avgDuration,
      generation_time_ms: generationTime,
      tokens_used: totalTokens,
    },
  }
}

/**
 * Expand a single hook (convenience method)
 */
export async function expandSingleHook(
  modelId: string,
  hook: GeneratedHook,
  options: Omit<ScriptExpansionOptions, 'batchSize'> = {}
): Promise<ExpandedScript | null> {
  const result = await expandScripts(modelId, [hook], { ...options, batchSize: 1 })
  return result.scripts[0] || null
}
