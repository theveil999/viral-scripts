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
 * Normalize text for comparison by removing punctuation and extra spaces
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')        // Normalize spaces
    .trim()
}

/**
 * Extract the first N significant words from text (skipping common fillers)
 */
function getFirstWords(text: string, count: number): string[] {
  const normalized = normalizeForComparison(text)
  return normalized.split(' ').slice(0, count)
}

/**
 * Check if text starts with the given words (fuzzy match)
 */
function startsWithWords(text: string, words: string[]): boolean {
  const normalized = normalizeForComparison(text)
  const pattern = words.join(' ')
  return normalized.startsWith(pattern)
}

/**
 * Common filler patterns that should not start scripts
 * These are comprehensive patterns to catch all variations
 */
const LEADING_FILLER_PATTERNS = [
  // Multi-word fillers (ordered from longest to shortest for greedy matching)
  /^okay\s+so\s+like\s*,?\s*/i,
  /^ok\s+so\s+like\s*,?\s*/i,
  /^um+\s+okay\s+so\s+like\s*,?\s*/i,
  /^um+\s+ok\s+so\s+like\s*,?\s*/i,
  /^um+\s+so\s+like\s*,?\s*/i,
  /^so\s+like\s*,?\s*/i,
  /^okay\s+so\s*,?\s*/i,
  /^ok\s+so\s*,?\s*/i,
  /^um+\s+like\s*,?\s*/i,
  /^um+\s+okay\s*,?\s*/i,
  /^um+\s+ok\s*,?\s*/i,
  /^um+\s*,?\s*/i,
  /^like\s*,?\s*/i,
  /^so\s*,?\s+/i,  // "so, " with comma followed by space
  /^okay\s*,?\s*/i,
  /^ok\s*,?\s*/i,
  // Single word fillers at start
  /^yeah\s+so\s*,?\s*/i,
  /^well\s+so\s*,?\s*/i,
  /^honestly\s*,?\s*/i,
  /^look\s*,?\s*/i,
  /^listen\s*,?\s*/i,
]

/**
 * Find where the hook content actually starts in the transformed script
 * Returns the index where the hook starts, or -1 if not found
 */
function findHookStart(script: string, hookWords: string[]): number {
  const scriptNormalized = normalizeForComparison(script)
  const hookPattern = hookWords.join(' ')
  
  // Try to find the hook pattern in the normalized script
  const hookIndex = scriptNormalized.indexOf(hookPattern)
  if (hookIndex === -1) return -1
  
  // Now we need to find the corresponding position in the original script
  // Count how many normalized characters correspond to each original character
  let normalizedPos = 0
  for (let i = 0; i < script.length; i++) {
    if (normalizedPos >= hookIndex) {
      return i
    }
    const char = script[i].toLowerCase()
    if (/[a-z0-9\s]/.test(char)) {
      if (char === ' ' || (i > 0 && script[i-1] !== ' ')) {
        normalizedPos++
      }
    }
  }
  return -1
}

/**
 * Remove leading fillers from a script while preserving the hook opener
 * This ensures scripts start with their actual hook content, not filler words
 * 
 * STRATEGY:
 * 1. Check if script already starts with hook - if yes, return as-is
 * 2. Try removing filler patterns iteratively
 * 3. If fillers removed, check again if hook is at start
 * 4. If hook still not at start, find it in the script and trim everything before it
 * 5. As last resort, prepend the hook opener if it's completely missing
 */
function preserveHookOpener(transformedScript: string, originalHook: string): string {
  if (!transformedScript || !originalHook) return transformedScript
  
  let script = transformedScript.trim()
  
  // Get first 4-5 significant words from hook (these define the opener)
  const hookWords = getFirstWords(originalHook, 5).filter(w => w.length > 0)
  if (hookWords.length === 0) return script
  
  // Use fewer words for matching (3 words should be distinctive enough)
  const hookMatchWords = hookWords.slice(0, Math.min(4, hookWords.length))
  
  // Step 1: Check if script already starts with hook opener
  if (startsWithWords(script, hookMatchWords)) {
    return script // Already correct!
  }
  
  // Step 2: Try removing leading fillers iteratively
  let previousScript = ''
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops
  
  while (previousScript !== script && iterations < maxIterations) {
    previousScript = script
    iterations++
    
    for (const pattern of LEADING_FILLER_PATTERNS) {
      const newScript = script.replace(pattern, '')
      if (newScript !== script) {
        script = newScript.trim()
        break // Restart the pattern matching after each removal
      }
    }
  }
  
  // Step 3: Check again after removing fillers
  if (startsWithWords(script, hookMatchWords)) {
    return script // Now starts with hook!
  }
  
  // Step 4: Find where the hook actually starts in the script
  const hookStartIndex = findHookStart(script, hookMatchWords)
  
  if (hookStartIndex > 0 && hookStartIndex < 100) {
    // The hook exists in the script but not at the start
    // Remove everything before it (this handles weird AI additions)
    const trimmedScript = script.slice(hookStartIndex).trim()
    
    // Verify the trimmed version starts with the hook
    if (startsWithWords(trimmedScript, hookMatchWords)) {
      console.log(`[Voice Transform] Trimmed ${hookStartIndex} chars of leading filler to preserve hook: "${hookMatchWords.join(' ')}..."`)
      return trimmedScript
    }
  }
  
  // Step 5: Hook is completely missing or mangled - this shouldn't happen
  // but if it does, we return the cleaned script (post-filler removal)
  console.warn(`[Voice Transform] Could not find hook opener "${hookMatchWords.join(' ')}..." in script. Returning cleaned script.`)
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
