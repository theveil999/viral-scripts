/**
 * @fileoverview hook-generation service
 * @module lib/services/hook-generation
 */
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/admin'
import { retrieveRelevantCorpus } from './corpus-retrieval'
import { buildHookGenerationPrompt } from '../prompts/hook-generation'
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

import type { PcmType } from '../prompts/hook-generation'

// Types
export interface GeneratedHook {
  hook: string
  hook_type: string
  parasocial_levers: string[]
  why_it_works: string
  quality_score?: number
  selected?: boolean
  // Kane Framework additions
  pcm_type?: PcmType
  variation_strategy?: string
  concept_id?: string
}

export interface HookVariationSet {
  concept_id: string
  concept: string
  variations: GeneratedHook[]
  recommended_for_testing: number[] // indices of recommended variations
}

export interface HookGenerationOptions {
  count?: number
  hookTypes?: string[]
  corpusLimit?: number
  temperature?: number
  // Kane Framework additions
  variationsPerConcept?: number // default 1, set to 3-5 for A/B testing
  enablePcmTracking?: boolean // track PCM personality type distribution
}

export interface HookGenerationResult {
  model_id: string
  hooks: GeneratedHook[]
  // Kane Framework additions
  variation_sets?: HookVariationSet[]
  generation_stats: {
    requested: number
    generated: number
    by_type: Record<string, number>
    by_pcm_type?: Record<string, number>
    generation_time_ms: number
    tokens_used: number
  }
}

// Default hook types
const ALL_HOOK_TYPES = [
  'bold_statement',
  'question',
  'confession',
  'challenge',
  'relatable',
  'fantasy',
  'hot_take',
  'storytime',
]

// Archetype to hook type affinity mapping
const ARCHETYPE_HOOK_AFFINITIES: Record<string, string[]> = {
  chaotic_unhinged: ['confession', 'hot_take', 'storytime', 'bold_statement'],
  southern_belle: ['relatable', 'bold_statement', 'confession', 'fantasy'],
  bratty_princess: ['challenge', 'hot_take', 'bold_statement', 'question'],
  girl_next_door: ['relatable', 'confession', 'question', 'fantasy'],
  gym_baddie: ['bold_statement', 'challenge', 'hot_take', 'relatable'],
  alt_egirl: ['confession', 'storytime', 'question', 'hot_take'],
  classy_mysterious: ['question', 'fantasy', 'bold_statement', 'storytime'],
  party_girl: ['storytime', 'confession', 'relatable', 'bold_statement'],
  nerdy_gamer_girl: ['relatable', 'question', 'confession', 'challenge'],
  spicy_latina: ['bold_statement', 'hot_take', 'challenge', 'confession'],
  cool_girl: ['bold_statement', 'relatable', 'hot_take', 'question'],
  soft_sensual: ['fantasy', 'confession', 'question', 'relatable'],
  dominant: ['challenge', 'bold_statement', 'hot_take', 'question'],
}

/**
 * Get optimal hook type distribution based on voice profile
 */
export function getHookTypeDistribution(
  count: number,
  voiceProfile: VoiceProfile,
  requestedTypes?: string[]
): Record<string, number> {
  const types = requestedTypes || ALL_HOOK_TYPES
  const primaryArchetype = voiceProfile.archetype_assignment?.primary || 'girl_next_door'
  const affinities = ARCHETYPE_HOOK_AFFINITIES[primaryArchetype] || ALL_HOOK_TYPES.slice(0, 4)

  const distribution: Record<string, number> = {}
  let remaining = count

  // Weight types by archetype affinity
  const weightedTypes = types.map((type) => ({
    type,
    weight: affinities.includes(type) ? 2 : 1,
  }))

  const totalWeight = weightedTypes.reduce((sum, t) => sum + t.weight, 0)

  for (const { type, weight } of weightedTypes) {
    const typeCount = Math.round((weight / totalWeight) * count)
    distribution[type] = Math.min(typeCount, remaining)
    remaining -= distribution[type]
  }

  // Distribute any remaining across top types
  let i = 0
  while (remaining > 0) {
    const type = weightedTypes[i % weightedTypes.length].type
    distribution[type]++
    remaining--
    i++
  }

  return distribution
}

/**
 * Parse JSON response from Claude, handling markdown code fences
 * Supports both flat hook arrays and variation set arrays
 */
function parseHooksResponse(text: string, isVariationMode: boolean = false): { 
  hooks: GeneratedHook[]
  variationSets?: HookVariationSet[] 
} {
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

  const parsed = JSON.parse(jsonText)

  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array')
  }

  // Check if this is variation mode (array of concept objects with variations)
  if (isVariationMode && parsed[0]?.variations) {
    const variationSets: HookVariationSet[] = parsed.map((set: {
      concept_id: string
      concept: string
      variations: GeneratedHook[]
      recommended_for_testing: string[]
    }) => ({
      concept_id: set.concept_id,
      concept: set.concept,
      variations: set.variations.map((v: GeneratedHook, i: number) => ({
        ...v,
        concept_id: set.concept_id,
      })),
      recommended_for_testing: set.recommended_for_testing?.map((r: string) => 
        parseInt(r.replace('variation_index_', ''))
      ) || [0, 1],
    }))

    // Flatten all variations into hooks array
    const hooks: GeneratedHook[] = variationSets.flatMap(set => set.variations)

    return { hooks, variationSets }
  }

  // Regular flat array of hooks
  return { hooks: parsed as GeneratedHook[] }
}

/**
 * Validate and clean hooks
 */
function validateHooks(hooks: GeneratedHook[]): GeneratedHook[] {
  const seen = new Set<string>()
  const valid: GeneratedHook[] = []

  for (const hook of hooks) {
    // Skip if missing required fields
    if (!hook.hook || typeof hook.hook !== 'string') continue
    if (!hook.hook_type || typeof hook.hook_type !== 'string') continue

    // Clean the hook text
    const cleanHook = hook.hook.trim()

    // Skip if empty or too long (over 25 words)
    if (!cleanHook) continue
    const wordCount = cleanHook.split(/\s+/).length
    if (wordCount > 25) continue

    // Skip duplicates (case-insensitive)
    const normalizedHook = cleanHook.toLowerCase()
    if (seen.has(normalizedHook)) continue
    seen.add(normalizedHook)

    // Ensure parasocial_levers is an array
    const levers = Array.isArray(hook.parasocial_levers) ? hook.parasocial_levers : []

    valid.push({
      hook: cleanHook,
      hook_type: hook.hook_type,
      parasocial_levers: levers,
      why_it_works: hook.why_it_works || '',
    })
  }

  return valid
}

/**
 * Generate hooks for a model
 */
export async function generateHooks(
  modelId: string,
  options: HookGenerationOptions = {}
): Promise<HookGenerationResult> {
  const {
    count = 30,
    hookTypes,
    corpusLimit = 15,
    temperature = 0.9,
    variationsPerConcept = 1,
    enablePcmTracking = false,
  } = options
  
  const isVariationMode = variationsPerConcept > 1

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

  // Step 2: Get corpus examples
  let corpusExamples: Awaited<ReturnType<typeof retrieveRelevantCorpus>>['matches'] = []

  if (model.embedding) {
    try {
      const corpusResult = await retrieveRelevantCorpus(modelId, { limit: corpusLimit })
      corpusExamples = corpusResult.matches
    } catch (err) {
      console.warn('Failed to retrieve corpus examples:', err)
      // Continue without corpus examples
    }
  }

  // Step 3: Determine hook type distribution
  const distribution = getHookTypeDistribution(count, voiceProfile, hookTypes)
  const typesToGenerate = Object.keys(distribution)

  // Step 4: Build prompt
  const prompt = buildHookGenerationPrompt({
    modelName: model.name,
    voiceProfile,
    corpusExamples,
    hookTypes: typesToGenerate,
    count,
    recentHooks: [], // TODO: fetch from hooks table
    variationsPerConcept,
    enablePcmTracking,
  })

  // Step 5: Call Claude API
  let hooks: GeneratedHook[] = []
  let variationSets: HookVariationSet[] | undefined
  let tokensUsed = 0
  let retryTemp = temperature

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192, // Increased for variation mode
        temperature: retryTemp,
        messages: [{ role: 'user', content: prompt }],
      })

      tokensUsed = response.usage?.output_tokens || 0

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const parsed = parseHooksResponse(content.text, isVariationMode)
      hooks = parsed.hooks
      variationSets = parsed.variationSets
      break
    } catch (err) {
      console.error(`Hook generation attempt ${attempt + 1} failed:`, err)
      if (attempt === 0) {
        retryTemp = 0.7 // Lower temperature for retry
      } else {
        throw err
      }
    }
  }

  // Step 6: Validate hooks
  hooks = validateHooks(hooks)

  // Step 7: Calculate stats
  const byType: Record<string, number> = {}
  for (const hook of hooks) {
    byType[hook.hook_type] = (byType[hook.hook_type] || 0) + 1
  }

  // Calculate PCM distribution if tracking enabled
  const byPcmType: Record<string, number> | undefined = enablePcmTracking ? {} : undefined
  if (byPcmType) {
    for (const hook of hooks) {
      if (hook.pcm_type) {
        byPcmType[hook.pcm_type] = (byPcmType[hook.pcm_type] || 0) + 1
      }
    }
  }

  const generationTime = Date.now() - startTime

  return {
    model_id: modelId,
    hooks,
    variation_sets: variationSets,
    generation_stats: {
      requested: count,
      generated: hooks.length,
      by_type: byType,
      by_pcm_type: byPcmType,
      generation_time_ms: generationTime,
      tokens_used: tokensUsed,
    },
  }
}

/**
 * Fetch recently used hooks for a model (to avoid duplicates)
 */
export async function getRecentHooks(modelId: string, limit = 100): Promise<string[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hooks } = await (supabase
    .from('hooks') as any)
    .select('content')
    .eq('model_id', modelId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return hooks?.map((h: { content: string }) => h.content) || []
}
