/**
 * @fileoverview batch-tracking service
 * @module lib/services/batch-tracking
 */
import { createAdminClient } from '../supabase/admin'
import type { PipelineResult, StageStats } from './script-pipeline'

// Types
export interface CreateBatchParams {
  modelId: string
  hooksRequested: number
  pipelineResult: PipelineResult
}

export interface BatchStats {
  total_batches: number
  total_scripts_generated: number
  total_scripts_passed: number
  avg_voice_fidelity: number
  avg_word_count: number
  total_time_ms: number
  total_tokens: number
  total_estimated_cost: number
}

/**
 * Generate a unique batch ID
 * Format: batch_YYYYMMDD_xxxxxx
 */
export function generateBatchId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `batch_${dateStr}_${randomPart}`
}

/**
 * Calculate estimated cost based on token usage across stages
 *
 * Pricing (per 1M tokens):
 * - Haiku: $0.25 input, $1.25 output
 * - Sonnet: $3 input, $15 output
 * - Opus: $15 input, $75 output
 * - Embeddings: $0.02 per 1M tokens
 *
 * For simplicity, we use output token counts and assume ~20% input tokens
 */
export function calculateEstimatedCost(
  totalTokens: number,
  stages: StageStats
): number {
  // Approximate breakdown by stage (based on typical usage)
  const haikuTokens = stages.validation.tokens_used
  const sonnetTokens = stages.hook_generation.tokens_used + stages.script_expansion.tokens_used
  const opusTokens = stages.voice_transformation.tokens_used

  // Calculate costs (output tokens * price per 1M)
  // Add ~20% for input tokens
  const haikuCost = (haikuTokens * 1.2) * (1.25 / 1_000_000)
  const sonnetCost = (sonnetTokens * 1.2) * (15 / 1_000_000)
  const opusCost = (opusTokens * 1.2) * (75 / 1_000_000)

  // Embeddings cost (small)
  const embeddingCost = 0.001 // ~$0.001 per batch

  return Math.round((haikuCost + sonnetCost + opusCost + embeddingCost) * 10000) / 10000
}

/**
 * Create a batch record for tracking
 */
export async function createBatch(params: CreateBatchParams): Promise<string> {
  const { modelId, hooksRequested, pipelineResult } = params

  const supabase = createAdminClient()
  const batchId = generateBatchId()

  const estimatedCost = calculateEstimatedCost(
    pipelineResult.total_tokens_used,
    pipelineResult.stages
  )

  const avgWordCount = pipelineResult.scripts.length > 0
    ? pipelineResult.scripts.reduce((sum, s) => sum + s.word_count, 0) / pipelineResult.scripts.length
    : 0

  const avgFidelity = pipelineResult.scripts.length > 0
    ? pipelineResult.scripts.reduce((sum, s) => sum + s.voice_fidelity_score, 0) / pipelineResult.scripts.length
    : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('script_batches') as any)
    .insert({
      batch_id: batchId,
      model_id: modelId,
      hooks_requested: hooksRequested,
      scripts_generated: pipelineResult.stages.hook_generation.generated,
      scripts_passed: pipelineResult.final_script_count,
      scripts_failed: pipelineResult.stages.validation.failed,
      avg_voice_fidelity: Math.round(avgFidelity * 100) / 100,
      avg_word_count: Math.round(avgWordCount * 10) / 10,
      total_time_ms: pipelineResult.total_time_ms,
      total_tokens: pipelineResult.total_tokens_used,
      estimated_cost_usd: estimatedCost,
      pipeline_version: '1.0',
    })

  if (error) {
    throw new Error(`Failed to create batch record: ${error.message}`)
  }

  return batchId
}

/**
 * Get aggregate batch stats for a model
 */
export async function getBatchStats(modelId: string): Promise<BatchStats> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('script_batches') as any)
    .select('*')
    .eq('model_id', modelId)

  if (error) {
    throw new Error(`Failed to fetch batch stats: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      total_batches: 0,
      total_scripts_generated: 0,
      total_scripts_passed: 0,
      avg_voice_fidelity: 0,
      avg_word_count: 0,
      total_time_ms: 0,
      total_tokens: 0,
      total_estimated_cost: 0,
    }
  }

  interface BatchRow {
    scripts_generated: number
    scripts_passed: number
    total_time_ms: number | null
    total_tokens: number | null
    estimated_cost_usd: number | null
    avg_voice_fidelity: number | null
    avg_word_count: number | null
  }

  const batches = data as BatchRow[]
  const totalBatches = batches.length
  const totalScriptsGenerated = batches.reduce((sum: number, b: BatchRow) => sum + b.scripts_generated, 0)
  const totalScriptsPassed = batches.reduce((sum: number, b: BatchRow) => sum + b.scripts_passed, 0)
  const totalTimeMs = batches.reduce((sum: number, b: BatchRow) => sum + (b.total_time_ms || 0), 0)
  const totalTokens = batches.reduce((sum: number, b: BatchRow) => sum + (b.total_tokens || 0), 0)
  const totalEstimatedCost = batches.reduce((sum: number, b: BatchRow) => sum + (b.estimated_cost_usd || 0), 0)

  // Weighted averages
  const avgVoiceFidelity = totalScriptsPassed > 0
    ? batches.reduce((sum: number, b: BatchRow) => sum + (b.avg_voice_fidelity || 0) * b.scripts_passed, 0) / totalScriptsPassed
    : 0

  const avgWordCount = totalScriptsPassed > 0
    ? batches.reduce((sum: number, b: BatchRow) => sum + (b.avg_word_count || 0) * b.scripts_passed, 0) / totalScriptsPassed
    : 0

  return {
    total_batches: totalBatches,
    total_scripts_generated: totalScriptsGenerated,
    total_scripts_passed: totalScriptsPassed,
    avg_voice_fidelity: Math.round(avgVoiceFidelity * 100) / 100,
    avg_word_count: Math.round(avgWordCount * 10) / 10,
    total_time_ms: totalTimeMs,
    total_tokens: totalTokens,
    total_estimated_cost: Math.round(totalEstimatedCost * 10000) / 10000,
  }
}

/**
 * Get recent batches for a model
 */
export async function getRecentBatches(
  modelId: string,
  limit: number = 10
): Promise<Array<{
  batch_id: string
  scripts_passed: number
  avg_voice_fidelity: number | null
  estimated_cost_usd: number | null
  created_at: string
}>> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('script_batches') as any)
    .select('batch_id, scripts_passed, avg_voice_fidelity, estimated_cost_usd, created_at')
    .eq('model_id', modelId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch recent batches: ${error.message}`)
  }

  return data || []
}
