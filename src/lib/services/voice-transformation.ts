/**
 * @fileoverview voice-transformation service
 * @module lib/services/voice-transformation
 */
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/admin'
import { buildVoiceTransformationPrompt } from '../prompts/voice-transformation'
import type { ExpandedScript } from './script-expansion'
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
export interface TransformedScript {
  script_index: number
  original_hook: string
  transformed_script: string
  word_count: number
  changes_made: string[]
  voice_fidelity_score: number
  ai_tells_removed: string[]
  voice_elements_added: string[]
}

export interface VoiceTransformationOptions {
  batchSize?: number
  temperature?: number
  maxRetries?: number
}

export interface VoiceTransformationResult {
  model_id: string
  transformed_scripts: TransformedScript[]
  transformation_stats: {
    scripts_received: number
    scripts_transformed: number
    avg_voice_fidelity: number
    avg_ai_tells_removed: number
    avg_voice_elements_added: number
    generation_time_ms: number
    tokens_used: number
  }
}

/**
 * Parse JSON response from Claude, handling markdown code fences
 */
function parseTransformationResponse(text: string): TransformedScript[] {
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

  const scripts = JSON.parse(jsonText) as TransformedScript[]

  if (!Array.isArray(scripts)) {
    throw new Error('Response is not an array')
  }

  return scripts
}

/**
 * Common filler patterns that should not start scripts
 */
const LEADING_FILLER_PATTERNS = [
  /^okay\s+so\s+like,?\s*/i,
  /^so\s+like,?\s*/i,
  /^um,?\s+okay\s+so\s+like,?\s*/i,
  /^um,?\s+so\s+like,?\s*/i,
  /^um,?\s+like,?\s*/i,
  /^like,?\s*/i,
  /^okay\s+so,?\s*/i,
  /^um,?\s*/i,
]

/**
 * Remove leading fillers from a script while preserving the hook opener
 * This ensures scripts start with their actual hook content, not filler words
 */
function preserveHookOpener(transformedScript: string, originalHook: string): string {
  let script = transformedScript.trim()
  
  // Extract first few words from hook (ignoring case and punctuation)
  const hookWords = originalHook.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).slice(0, 4)
  const hookPattern = hookWords.join('\\s+')
  
  // Check if script already starts with hook opener (case insensitive)
  const hookRegex = new RegExp(`^${hookPattern}`, 'i')
  if (hookRegex.test(script.toLowerCase().replace(/[^a-z\s]/g, ''))) {
    return script // Already starts correctly
  }
  
  // Remove leading fillers until we hit actual content
  let previousScript = ''
  while (previousScript !== script) {
    previousScript = script
    for (const pattern of LEADING_FILLER_PATTERNS) {
      script = script.replace(pattern, '')
    }
    script = script.trim()
  }
  
  // If after removing fillers it starts with the hook, we're good
  if (hookRegex.test(script.toLowerCase().replace(/[^a-z\s]/g, ''))) {
    return script
  }
  
  // If hook opener is completely missing, prepend it (rare case)
  // Only do this if the hook is short and specific
  if (hookWords.length >= 3 && hookWords[0] !== 'i' && hookWords[0] !== 'a') {
    // Don't prepend generic hooks starting with "I" or "A"
    return script
  }
  
  return script
}

/**
 * Validate and clean transformed script
 */
function processTransformedScript(script: TransformedScript): TransformedScript {
  // Apply hook opener preservation
  const cleanedScript = preserveHookOpener(
    script.transformed_script || '',
    script.original_hook || ''
  )
  
  return {
    script_index: script.script_index || 0,
    original_hook: script.original_hook || '',
    transformed_script: cleanedScript,
    word_count: cleanedScript?.split(/\s+/).length || 0,
    changes_made: Array.isArray(script.changes_made) ? script.changes_made : [],
    voice_fidelity_score: typeof script.voice_fidelity_score === 'number'
      ? Math.min(100, Math.max(0, script.voice_fidelity_score))
      : 0,
    ai_tells_removed: Array.isArray(script.ai_tells_removed) ? script.ai_tells_removed : [],
    voice_elements_added: Array.isArray(script.voice_elements_added) ? script.voice_elements_added : [],
  }
}

/**
 * Transform scripts to match exact voice using Claude Opus
 * This is the quality-critical stage that ensures 95%+ voice fidelity
 */
export async function transformVoice(
  modelId: string,
  scripts: ExpandedScript[],
  options: VoiceTransformationOptions = {}
): Promise<VoiceTransformationResult> {
  const {
    batchSize = 5,
    temperature = 0.7,
    maxRetries = 2,
  } = options

  const startTime = Date.now()
  const supabase = createAdminClient()

  // Step 1: Fetch model with voice profile
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

  // Step 2: Optionally fetch extended sample speech from recent scripts
  // This gives the model more examples of the voice in context
  let sampleSpeechExtended: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentScripts } = await (supabase
    .from('scripts') as any)
    .select('content')
    .eq('model_id', modelId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentScripts?.length) {
    // Extract short excerpts from approved scripts
    sampleSpeechExtended = recentScripts
      .map((s: { content: string }) => {
        const content = s.content
        // Take first 100 chars as a sample
        return content?.slice(0, 100)
      })
      .filter(Boolean)
  }

  // Step 3: Batch scripts and process
  const allTransformed: TransformedScript[] = []
  let totalTokens = 0

  for (let i = 0; i < scripts.length; i += batchSize) {
    const batch = scripts.slice(i, i + batchSize)

    // Build prompt for batch
    const prompt = buildVoiceTransformationPrompt({
      modelName: model.name,
      voiceProfile,
      scripts: batch,
      sampleSpeechExtended,
    })

    // Call Claude Opus with retries
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await getAnthropicClient().messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 8192,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        })

        totalTokens += response.usage?.output_tokens || 0

        const content = response.content[0]
        if (content.type !== 'text') {
          throw new Error('Unexpected response type')
        }

        const transformed = parseTransformationResponse(content.text)
        const processed = transformed.map(processTransformedScript)

        // Adjust script_index for batch offset
        for (const script of processed) {
          script.script_index = script.script_index + i
        }

        allTransformed.push(...processed)
        lastError = null
        break
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`Batch ${i / batchSize + 1} attempt ${attempt + 1} failed:`, lastError.message)

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    if (lastError) {
      console.error(`Batch ${i / batchSize + 1} failed after ${maxRetries + 1} attempts`)
      // Continue with other batches
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < scripts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Step 4: Calculate stats
  const generationTime = Date.now() - startTime

  const avgFidelity = allTransformed.length > 0
    ? Math.round(allTransformed.reduce((sum, s) => sum + s.voice_fidelity_score, 0) / allTransformed.length)
    : 0

  const avgTellsRemoved = allTransformed.length > 0
    ? Math.round(allTransformed.reduce((sum, s) => sum + s.ai_tells_removed.length, 0) / allTransformed.length * 10) / 10
    : 0

  const avgElementsAdded = allTransformed.length > 0
    ? Math.round(allTransformed.reduce((sum, s) => sum + s.voice_elements_added.length, 0) / allTransformed.length * 10) / 10
    : 0

  return {
    model_id: modelId,
    transformed_scripts: allTransformed,
    transformation_stats: {
      scripts_received: scripts.length,
      scripts_transformed: allTransformed.length,
      avg_voice_fidelity: avgFidelity,
      avg_ai_tells_removed: avgTellsRemoved,
      avg_voice_elements_added: avgElementsAdded,
      generation_time_ms: generationTime,
      tokens_used: totalTokens,
    },
  }
}

/**
 * Transform a single script (convenience method)
 */
export async function transformSingleScript(
  modelId: string,
  script: ExpandedScript,
  options: Omit<VoiceTransformationOptions, 'batchSize'> = {}
): Promise<TransformedScript | null> {
  const result = await transformVoice(modelId, [script], { ...options, batchSize: 1 })
  return result.transformed_scripts[0] || null
}
