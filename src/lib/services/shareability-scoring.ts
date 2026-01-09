/**
 * @fileoverview Shareability Scoring Service
 * @module lib/services/shareability-scoring
 * 
 * Scores hooks and scripts on viral share potential based on
 * Brendan Kane's frameworks and corpus analysis patterns.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  buildShareabilityScoringPrompt,
  estimateShareabilityFromPatterns,
  type ShareTrigger,
  type EmotionalResponse,
  type ViralPotential,
  SHARE_TRIGGER_PATTERNS,
} from '../prompts/shareability-scoring'

// Re-export types from prompt file
export type { ShareTrigger, EmotionalResponse, ViralPotential }

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

export interface ShareabilityScore {
  score: number // 0-100
  specificity_score?: number
  emotional_punch_score?: number
  share_trigger_score?: number
  authenticity_score?: number
  primary_trigger: ShareTrigger
  secondary_trigger?: ShareTrigger
  share_prediction: string // "Girls will send to their man"
  emotional_response: EmotionalResponse
  viral_potential: ViralPotential
  reasoning: string
}

export interface ShareabilityScoringResult {
  scores: Array<{
    content: string
    content_type: 'hook' | 'script'
    shareability: ShareabilityScore
  }>
  batch_stats: {
    avg_score: number
    high_potential_count: number
    primary_triggers: Record<string, number>
    tokens_used: number
    time_ms: number
  }
}

// Re-export SHARE_TRIGGER_PATTERNS for external use
export { SHARE_TRIGGER_PATTERNS }

/**
 * Parse shareability scoring response (with detailed rubric scores)
 */
function parseShareabilityResponse(text: string): Array<{
  index: number
  specificity_score: number
  emotional_punch_score: number
  share_trigger_score: number
  authenticity_score: number
  total_score: number
  primary_trigger: ShareTrigger
  secondary_trigger?: ShareTrigger
  share_prediction: string
  emotional_response: EmotionalResponse
  viral_potential: ViralPotential
  reasoning: string
}> {
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

  return JSON.parse(jsonText)
}

/**
 * Score content for shareability
 */
export async function scoreShareability(
  contents: Array<{ content: string; content_type: 'hook' | 'script' }>
): Promise<ShareabilityScoringResult> {
  const startTime = Date.now()

  if (contents.length === 0) {
    return {
      scores: [],
      batch_stats: {
        avg_score: 0,
        high_potential_count: 0,
        primary_triggers: {},
        tokens_used: 0,
        time_ms: 0,
      },
    }
  }

  // Build prompt using the prompt builder from prompts file
  const prompt = buildShareabilityScoringPrompt({
    contents: contents.map((c, i) => ({
      content: c.content,
      content_type: c.content_type,
      index: i,
    })),
  })

  // Call Claude API
  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.3, // Low temperature for consistent scoring
    messages: [{ role: 'user', content: prompt }],
  })

  const tokensUsed = response.usage?.output_tokens || 0

  const responseContent = response.content[0]
  if (responseContent.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  const parsed = parseShareabilityResponse(responseContent.text)

  // Build results with detailed rubric scores
  const scores = parsed.map((p) => ({
    content: contents[p.index].content,
    content_type: contents[p.index].content_type,
    shareability: {
      score: p.total_score,
      specificity_score: p.specificity_score,
      emotional_punch_score: p.emotional_punch_score,
      share_trigger_score: p.share_trigger_score,
      authenticity_score: p.authenticity_score,
      primary_trigger: p.primary_trigger,
      secondary_trigger: p.secondary_trigger,
      share_prediction: p.share_prediction,
      emotional_response: p.emotional_response,
      viral_potential: p.viral_potential,
      reasoning: p.reasoning,
    },
  }))

  // Calculate batch stats
  const avgScore = scores.reduce((sum, s) => sum + s.shareability.score, 0) / scores.length
  const highPotentialCount = scores.filter(
    s => s.shareability.viral_potential === 'high' || s.shareability.viral_potential === 'viral'
  ).length

  const primaryTriggers: Record<string, number> = {}
  for (const s of scores) {
    primaryTriggers[s.shareability.primary_trigger] = 
      (primaryTriggers[s.shareability.primary_trigger] || 0) + 1
  }

  return {
    scores,
    batch_stats: {
      avg_score: Math.round(avgScore),
      high_potential_count: highPotentialCount,
      primary_triggers: primaryTriggers,
      tokens_used: tokensUsed,
      time_ms: Date.now() - startTime,
    },
  }
}

/**
 * Quick shareability check using pattern matching (no API call)
 * Returns a rough estimate based on corpus patterns
 * 
 * Delegates to the prompt file's implementation for consistency
 */
export function quickShareabilityEstimate(content: string): {
  estimated_score: number
  detected_triggers: ShareTrigger[]
  confidence: 'low' | 'medium' | 'high'
  strongest_trigger: ShareTrigger | null
} {
  return estimateShareabilityFromPatterns(content)
}

