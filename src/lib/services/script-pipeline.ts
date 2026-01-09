import { createAdminClient } from '../supabase/admin'
import { retrieveRelevantCorpus } from './corpus-retrieval'
import { generateHooks, type GeneratedHook, type HookVariationSet } from './hook-generation'
import { expandScripts, type ExpandedScript } from './script-expansion'
import { transformVoice, type TransformedScript } from './voice-transformation'
import { validateScripts, getPassingScripts, getScriptsNeedingRevision } from './script-validation'
import { scoreShareability, type ShareabilityScore } from './shareability-scoring'
import type { TargetDuration, OrganicCtaType } from '../prompts/script-expansion'
import type { PcmType } from '../prompts/hook-generation'

// Types
export interface PipelineOptions {
  hookCount?: number
  targetDuration?: TargetDuration
  minFidelityScore?: number
  autoRevise?: boolean
  maxRevisionAttempts?: number
  corpusLimit?: number
  // Kane Framework additions
  variationsPerConcept?: number  // default: 1 (no variations), set to 3-5 for A/B testing
  enableShareabilityScoring?: boolean  // default: true
  ctaStyle?: OrganicCtaType | 'auto'  // organic CTA type preference
  enablePcmTracking?: boolean  // default: true - track PCM personality distribution
}

export interface StageStats {
  corpus_retrieval: {
    matches: number
    avg_similarity: number
    time_ms: number
  }
  hook_generation: {
    generated: number
    by_pcm_type?: Record<string, number>
    variation_sets_count?: number
    time_ms: number
    tokens_used: number
  }
  shareability_scoring?: {
    scored: number
    avg_score: number
    high_potential_count: number
    time_ms: number
    tokens_used: number
  }
  script_expansion: {
    expanded: number
    avg_words: number
    time_ms: number
    tokens_used: number
  }
  voice_transformation: {
    transformed: number
    avg_fidelity: number
    time_ms: number
    tokens_used: number
  }
  validation: {
    passed: number
    revised: number
    failed: number
    avg_fidelity: number
    time_ms: number
    tokens_used: number
  }
}

export interface FinalScript {
  id?: string
  hook: string
  hook_type: string
  script: string
  word_count: number
  estimated_duration_seconds: number
  voice_fidelity_score: number
  parasocial_levers: string[]
  created_at?: string
  // Kane Framework additions
  variation_group_id?: string
  concept_id?: string
  shareability_score?: number
  share_trigger?: string
  share_prediction?: string
  emotional_response?: string
  cta_type?: string
  pcm_type?: PcmType
}

export interface PipelineResult {
  model_id: string
  model_name: string
  scripts: FinalScript[]
  stages: StageStats
  total_time_ms: number
  total_tokens_used: number
  final_script_count: number
  // Kane Framework additions
  variation_sets?: HookVariationSet[]
  pcm_distribution?: Record<string, number>
  shareability_summary?: {
    avg_score: number
    high_potential_count: number
    top_triggers: Record<string, number>
  }
}

/**
 * Run the complete script generation pipeline
 */
export async function runPipeline(
  modelId: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const {
    hookCount = 30,
    targetDuration = 'medium',
    minFidelityScore = 80,
    autoRevise = true,
    maxRevisionAttempts = 2,
    corpusLimit = 15,
    // Kane Framework options
    variationsPerConcept = 1,
    enableShareabilityScoring = true,
    ctaStyle = 'auto',
    enablePcmTracking = true,
  } = options

  const pipelineStart = Date.now()
  const supabase = createAdminClient()

  // Fetch model info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: model, error: modelError } = await (supabase
    .from('models') as any)
    .select('id, name, embedding')
    .eq('id', modelId)
    .single()

  if (modelError || !model) {
    throw new Error(`Failed to fetch model ${modelId}: ${modelError?.message || 'Not found'}`)
  }

  // Initialize stage stats
  const stages: StageStats = {
    corpus_retrieval: { matches: 0, avg_similarity: 0, time_ms: 0 },
    hook_generation: { generated: 0, time_ms: 0, tokens_used: 0 },
    shareability_scoring: enableShareabilityScoring 
      ? { scored: 0, avg_score: 0, high_potential_count: 0, time_ms: 0, tokens_used: 0 }
      : undefined,
    script_expansion: { expanded: 0, avg_words: 0, time_ms: 0, tokens_used: 0 },
    voice_transformation: { transformed: 0, avg_fidelity: 0, time_ms: 0, tokens_used: 0 },
    validation: { passed: 0, revised: 0, failed: 0, avg_fidelity: 0, time_ms: 0, tokens_used: 0 },
  }

  let totalTokens = 0

  // ===================
  // STAGE 1: Corpus Retrieval
  // ===================
  console.log('Stage 1: Corpus Retrieval...')
  const corpusStart = Date.now()

  let corpusMatches = 0
  let avgSimilarity = 0

  if (model.embedding) {
    try {
      const corpusResult = await retrieveRelevantCorpus(modelId, { limit: corpusLimit })
      corpusMatches = corpusResult.matches.length
      avgSimilarity = corpusResult.retrieval_stats.avg_similarity
    } catch (err) {
      console.warn('Corpus retrieval failed:', err)
    }
  }

  stages.corpus_retrieval = {
    matches: corpusMatches,
    avg_similarity: avgSimilarity,
    time_ms: Date.now() - corpusStart,
  }

  // ===================
  // STAGE 2: Hook Generation (with variations + PCM tracking)
  // ===================
  console.log('Stage 2: Hook Generation...')
  const hookStart = Date.now()

  const hookResult = await generateHooks(modelId, {
    count: hookCount,
    temperature: 0.9,
    variationsPerConcept,
    enablePcmTracking,
  })

  stages.hook_generation = {
    generated: hookResult.hooks.length,
    by_pcm_type: hookResult.generation_stats.by_pcm_type,
    variation_sets_count: hookResult.variation_sets?.length,
    time_ms: Date.now() - hookStart,
    tokens_used: hookResult.generation_stats.tokens_used,
  }
  totalTokens += hookResult.generation_stats.tokens_used

  // Store variation sets for result
  const variationSets = hookResult.variation_sets

  // ===================
  // STAGE 2.5: Shareability Scoring (Kane Framework)
  // ===================
  let shareabilityScores: Map<string, ShareabilityScore> = new Map()
  
  if (enableShareabilityScoring && hookResult.hooks.length > 0) {
    console.log('Stage 2.5: Shareability Scoring...')
    const shareStart = Date.now()
    
    try {
      const shareabilityResult = await scoreShareability(
        hookResult.hooks.map(h => ({ content: h.hook, content_type: 'hook' as const }))
      )
      
      // Create a map from hook content to shareability score
      for (const score of shareabilityResult.scores) {
        shareabilityScores.set(score.content, score.shareability)
      }
      
      stages.shareability_scoring = {
        scored: shareabilityResult.scores.length,
        avg_score: shareabilityResult.batch_stats.avg_score,
        high_potential_count: shareabilityResult.batch_stats.high_potential_count,
        time_ms: Date.now() - shareStart,
        tokens_used: shareabilityResult.batch_stats.tokens_used,
      }
      totalTokens += shareabilityResult.batch_stats.tokens_used
    } catch (err) {
      console.warn('Shareability scoring failed:', err)
    }
  }

  // ===================
  // STAGE 3: Script Expansion (with organic CTAs)
  // ===================
  console.log('Stage 3: Script Expansion...')
  const expandStart = Date.now()

  const expansionResult = await expandScripts(modelId, hookResult.hooks, {
    targetDuration,
    corpusLimit,
    ctaType: ctaStyle,
  })

  stages.script_expansion = {
    expanded: expansionResult.scripts.length,
    avg_words: expansionResult.expansion_stats.avg_word_count,
    time_ms: Date.now() - expandStart,
    tokens_used: expansionResult.expansion_stats.tokens_used,
  }
  totalTokens += expansionResult.expansion_stats.tokens_used

  // ===================
  // STAGE 4: Voice Transformation
  // ===================
  console.log('Stage 4: Voice Transformation...')
  const transformStart = Date.now()

  const transformResult = await transformVoice(modelId, expansionResult.scripts, {
    batchSize: 5,
    temperature: 0.7,
  })

  stages.voice_transformation = {
    transformed: transformResult.transformed_scripts.length,
    avg_fidelity: transformResult.transformation_stats.avg_voice_fidelity,
    time_ms: Date.now() - transformStart,
    tokens_used: transformResult.transformation_stats.tokens_used,
  }
  totalTokens += transformResult.transformation_stats.tokens_used

  // ===================
  // STAGE 5: Validation
  // ===================
  console.log('Stage 5: Validation...')
  const validationStart = Date.now()

  let currentScripts = transformResult.transformed_scripts
  let validationResult = await validateScripts(modelId, currentScripts)

  let revisedCount = 0
  let validationTokens = validationResult.tokens_used

  // Auto-revision loop
  if (autoRevise) {
    for (let attempt = 0; attempt < maxRevisionAttempts; attempt++) {
      const needsRevision = getScriptsNeedingRevision(currentScripts, validationResult.validations)

      if (needsRevision.length === 0) break

      console.log(`  Revision attempt ${attempt + 1}: ${needsRevision.length} scripts...`)

      // Convert back to ExpandedScript format for re-transformation
      const scriptsToRevise: ExpandedScript[] = needsRevision.map((item) => ({
        hook_index: item.script.script_index,
        hook: item.script.original_hook,
        script: item.script.transformed_script,
        word_count: item.script.word_count,
        estimated_duration_seconds: 30,
        structure_breakdown: { hook: '', tension: '', payload: '', closer: '' },
        parasocial_levers_used: [],
        voice_elements_used: [],
      }))

      // Re-transform with lower temperature for more consistency
      const reviseResult = await transformVoice(modelId, scriptsToRevise, {
        batchSize: 5,
        temperature: 0.5,
      })

      totalTokens += reviseResult.transformation_stats.tokens_used
      revisedCount += reviseResult.transformed_scripts.length

      // Replace revised scripts in the current set
      for (const revised of reviseResult.transformed_scripts) {
        const originalIndex = needsRevision[revised.script_index]?.script.script_index
        if (originalIndex !== undefined) {
          currentScripts[originalIndex] = revised
          currentScripts[originalIndex].script_index = originalIndex
        }
      }

      // Re-validate
      validationResult = await validateScripts(modelId, currentScripts)
      validationTokens += validationResult.tokens_used
    }
  }

  stages.validation = {
    passed: validationResult.summary.passed,
    revised: revisedCount,
    failed: validationResult.summary.failed,
    avg_fidelity: validationResult.summary.avg_fidelity_score,
    time_ms: Date.now() - validationStart,
    tokens_used: validationTokens,
  }
  totalTokens += validationTokens

  // ===================
  // FINAL: Filter passing scripts
  // ===================
  const passingScripts = getPassingScripts(currentScripts, validationResult.validations)

  // Build final scripts with all metadata including Kane Framework additions
  const finalScripts: FinalScript[] = passingScripts.map((script, index) => {
    const originalHook = hookResult.hooks.find((h, i) => i === script.script_index)
    const validation = validationResult.validations.find((v) => v.script_index === script.script_index)
    const expandedScript = expansionResult.scripts.find((s) => s.hook_index === script.script_index)
    
    // Get shareability data if available
    const shareability = shareabilityScores.get(script.original_hook)

    return {
      hook: script.original_hook,
      hook_type: originalHook?.hook_type || 'unknown',
      script: script.transformed_script,
      word_count: script.word_count,
      estimated_duration_seconds: Math.round(script.word_count / 2.5),
      voice_fidelity_score: validation?.voice_fidelity_score || script.voice_fidelity_score,
      parasocial_levers: originalHook?.parasocial_levers || [],
      // Kane Framework additions
      concept_id: originalHook?.concept_id,
      shareability_score: shareability?.score,
      share_trigger: shareability?.primary_trigger,
      share_prediction: shareability?.share_prediction,
      emotional_response: shareability?.emotional_response,
      cta_type: expandedScript?.cta_type,
      pcm_type: originalHook?.pcm_type as PcmType | undefined,
    }
  })

  const totalTime = Date.now() - pipelineStart

  // Calculate PCM distribution summary
  const pcmDistribution: Record<string, number> = {}
  for (const script of finalScripts) {
    if (script.pcm_type) {
      pcmDistribution[script.pcm_type] = (pcmDistribution[script.pcm_type] || 0) + 1
    }
  }

  // Calculate shareability summary
  const shareabilitySummary = enableShareabilityScoring && stages.shareability_scoring ? {
    avg_score: stages.shareability_scoring.avg_score,
    high_potential_count: stages.shareability_scoring.high_potential_count,
    top_triggers: {} as Record<string, number>,
  } : undefined

  if (shareabilitySummary) {
    for (const script of finalScripts) {
      if (script.share_trigger) {
        shareabilitySummary.top_triggers[script.share_trigger] = 
          (shareabilitySummary.top_triggers[script.share_trigger] || 0) + 1
      }
    }
  }

  return {
    model_id: modelId,
    model_name: model.name,
    scripts: finalScripts,
    stages,
    total_time_ms: totalTime,
    total_tokens_used: totalTokens,
    final_script_count: finalScripts.length,
    // Kane Framework additions
    variation_sets: variationSets,
    pcm_distribution: Object.keys(pcmDistribution).length > 0 ? pcmDistribution : undefined,
    shareability_summary: shareabilitySummary,
  }
}

/**
 * Save final scripts to the database
 */
export async function saveScriptsToDatabase(
  modelId: string,
  scripts: FinalScript[],
  variationGroupId?: string
): Promise<string[]> {
  const supabase = createAdminClient()

  const records = scripts.map((script) => ({
    model_id: modelId,
    hook: script.hook,
    hook_type: script.hook_type,
    content: script.script,
    word_count: script.word_count,
    duration_seconds: script.estimated_duration_seconds,
    voice_fidelity_score: script.voice_fidelity_score,
    parasocial_levers: script.parasocial_levers,
    status: 'draft' as const,
    // Kane Framework additions
    variation_group_id: variationGroupId || script.variation_group_id,
    shareability_score: script.shareability_score,
    share_trigger: script.share_trigger,
    share_prediction: script.share_prediction,
    emotional_response: script.emotional_response,
    cta_type: script.cta_type,
    pcm_type: script.pcm_type,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('scripts') as any)
    .insert(records)
    .select('id')

  if (error) {
    throw new Error(`Failed to save scripts: ${error.message}`)
  }

  return data.map((r: { id: string }) => r.id)
}

/**
 * Run pipeline and save results to database
 */
export async function runPipelineAndSave(
  modelId: string,
  options: PipelineOptions = {}
): Promise<PipelineResult & { saved_ids: string[] }> {
  const result = await runPipeline(modelId, options)

  const savedIds = await saveScriptsToDatabase(modelId, result.scripts)

  // Update scripts with their IDs
  for (let i = 0; i < result.scripts.length; i++) {
    result.scripts[i].id = savedIds[i]
  }

  return {
    ...result,
    saved_ids: savedIds,
  }
}
