/**
 * Shareability Scoring Service
 * 
 * Scores hooks and scripts on viral share potential based on
 * Brendan Kane's frameworks and corpus analysis patterns.
 */

import Anthropic from '@anthropic-ai/sdk'

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

// Share trigger types - why someone would share this content
export type ShareTrigger = 
  | 'tag_friend'        // "Send to your man" energy
  | 'self_identification' // "This is so me" reaction  
  | 'controversy_bait'   // Hot take that demands response
  | 'fantasy_projection' // Makes viewer imagine scenario
  | 'validation_seeking' // "Am I the only one?"
  | 'humor_share'        // Pure entertainment value
  | 'educational_value'  // "You need to see this"
  | 'aspirational'       // "Goals" energy

// Emotional response types
export type EmotionalResponse = 
  | 'desire'       // Sexual/romantic wanting
  | 'recognition'  // "Omg same" feeling
  | 'controversy'  // Disagreement/debate trigger
  | 'amusement'    // Laughter/entertainment
  | 'validation'   // Feeling seen/understood
  | 'curiosity'    // Need to know more
  | 'fomo'         // Fear of missing out

export interface ShareabilityScore {
  score: number // 0-100
  primary_trigger: ShareTrigger
  secondary_trigger?: ShareTrigger
  share_prediction: string // "Girls will send to their man"
  emotional_response: EmotionalResponse
  viral_potential: 'low' | 'medium' | 'high' | 'very_high'
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

// Corpus-derived patterns for each share trigger
const SHARE_TRIGGER_PATTERNS: Record<ShareTrigger, {
  description: string
  indicators: string[]
  corpus_examples: string[]
}> = {
  tag_friend: {
    description: '"Send to your man" or "tag a friend who" energy',
    indicators: ['direct relationship advice', 'men should/need to', 'if your man', 'ladies if'],
    corpus_examples: [
      'Ladies, if you don\'t have to ask your man to give you...',
      'Ladies, if your man takes you out on a date...',
      'If your girl is turning you down...',
    ],
  },
  self_identification: {
    description: '"This is so me" or "omg same" reaction',
    indicators: ['do you ever', 'am I the only one', 'I cannot be the only', 'pov:', 'when you'],
    corpus_examples: [
      'Do you ever wake up from a really good dream...',
      'I cannot be the only one who thinks...',
      'Do you ever look at a man and just know...',
    ],
  },
  controversy_bait: {
    description: 'Hot take that demands response or debate',
    indicators: ['I don\'t care what', 'unpopular opinion', 'I said what I said', 'fight me on this'],
    corpus_examples: [
      'I don\'t care what people say, okay?',
      'Unpopular opinion, I guess, but...',
      'I will die on this hill.',
    ],
  },
  fantasy_projection: {
    description: 'Makes viewer imagine themselves in scenario',
    indicators: ['I want a man who', 'imagine if', 'picture this', 'I need a man'],
    corpus_examples: [
      'I want a man who\'s gonna...',
      'I need a man who...',
      'I just want somebody who\'s gonna...',
    ],
  },
  validation_seeking: {
    description: '"Am I the only one?" or "Is this normal?" energy',
    indicators: ['is that so hard', 'am I asking for too much', 'is this a red flag', 'where are the'],
    corpus_examples: [
      'Am I asking for too much here?',
      'Is that so hard?',
      'Where are the guys who...',
    ],
  },
  humor_share: {
    description: 'Pure entertainment/comedy value',
    indicators: ['I-', 'bruh', 'I\'m screaming', 'dead', 'I can\'t', 'help'],
    corpus_examples: [
      'The way I just...',
      'Sir, I-',
      'Help! My pussy\'s gone crazy!',
    ],
  },
  educational_value: {
    description: '"You need to learn this" or tip/advice sharing',
    indicators: ['here\'s how', 'the key to', 'tip:', 'you need to', 'this is why'],
    corpus_examples: [
      'The key to giving a really good job is...',
      'Here\'s how to make his eyes roll back...',
      'This is why you need to date a gym girl...',
    ],
  },
  aspirational: {
    description: '"Goals" or lifestyle aspiration',
    indicators: ['marriage material', 'wife him', 'that\'s a keeper', 'hold on to him'],
    corpus_examples: [
      'That\'s marriage material right there.',
      'If you find one, don\'t let him go.',
      'You fucked up, okay? Cause now I\'m never letting you go.',
    ],
  },
}

/**
 * Build the shareability scoring prompt
 */
function buildShareabilityScoringPrompt(
  contents: Array<{ content: string; content_type: 'hook' | 'script' }>
): string {
  const triggersSection = Object.entries(SHARE_TRIGGER_PATTERNS)
    .map(([trigger, data]) => `
${trigger.toUpperCase()}:
  - ${data.description}
  - Indicators: ${data.indicators.join(', ')}
  - Examples: "${data.corpus_examples[0]}"`)
    .join('\n')

  const contentsSection = contents
    .map((c, i) => `${i + 1}. [${c.content_type}] "${c.content}"`)
    .join('\n')

  return `You are a viral content analyst specializing in shareability prediction for OnlyFans creator content targeting male audiences.

## SHARE TRIGGER PATTERNS

${triggersSection}

## EMOTIONAL RESPONSES

- desire: Sexual/romantic wanting
- recognition: "Omg same" feeling
- controversy: Disagreement/debate trigger
- amusement: Laughter/entertainment
- validation: Feeling seen/understood
- curiosity: Need to know more
- fomo: Fear of missing out

## CONTENT TO SCORE

${contentsSection}

## SCORING CRITERIA

For each piece of content, assess:

1. SHARE TRIGGER: What would make someone share this?
   - Primary trigger (most likely reason to share)
   - Secondary trigger (additional sharing motivation)

2. EMOTIONAL RESPONSE: What emotion does this trigger?

3. SHAREABILITY SCORE (0-100):
   - 0-30: Low - Generic, forgettable, no share motivation
   - 31-50: Medium - Decent engagement but unlikely to spread
   - 51-70: High - Strong share potential, hits multiple triggers
   - 71-100: Very High - Viral potential, irresistible to share

4. SHARE PREDICTION: One sentence describing WHO will share and WHY
   - Example: "Girls will send to their man as a hint"
   - Example: "Women will tag friends who can relate"

5. VIRAL POTENTIAL: low | medium | high | very_high

## OUTPUT FORMAT

Return a JSON array:

[
  {
    "content_index": 0,
    "score": 75,
    "primary_trigger": "fantasy_projection",
    "secondary_trigger": "tag_friend",
    "share_prediction": "Women will send to their man or tag him in comments",
    "emotional_response": "desire",
    "viral_potential": "high",
    "reasoning": "Strong direct address combined with specific fantasy imagery creates share-worthy content"
  }
]

Score ALL ${contents.length} pieces of content. Return ONLY the JSON array.`
}

/**
 * Parse shareability scoring response
 */
function parseShareabilityResponse(text: string): Array<{
  content_index: number
  score: number
  primary_trigger: ShareTrigger
  secondary_trigger?: ShareTrigger
  share_prediction: string
  emotional_response: EmotionalResponse
  viral_potential: 'low' | 'medium' | 'high' | 'very_high'
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

  // Build prompt
  const prompt = buildShareabilityScoringPrompt(contents)

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

  // Build results
  const scores = parsed.map((p) => ({
    content: contents[p.content_index].content,
    content_type: contents[p.content_index].content_type,
    shareability: {
      score: p.score,
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
    s => s.shareability.viral_potential === 'high' || s.shareability.viral_potential === 'very_high'
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
 */
export function quickShareabilityEstimate(content: string): {
  estimated_score: number
  detected_triggers: ShareTrigger[]
  confidence: 'low' | 'medium' | 'high'
} {
  const lowerContent = content.toLowerCase()
  const detectedTriggers: ShareTrigger[] = []
  let score = 40 // Base score

  // Check each trigger pattern
  for (const [trigger, data] of Object.entries(SHARE_TRIGGER_PATTERNS)) {
    const matchCount = data.indicators.filter(ind => 
      lowerContent.includes(ind.toLowerCase())
    ).length

    if (matchCount > 0) {
      detectedTriggers.push(trigger as ShareTrigger)
      score += matchCount * 10
    }
  }

  // Bonus for multiple triggers
  if (detectedTriggers.length >= 2) {
    score += 15
  }
  if (detectedTriggers.length >= 3) {
    score += 10
  }

  // Cap at 100
  score = Math.min(score, 100)

  return {
    estimated_score: score,
    detected_triggers: detectedTriggers,
    confidence: detectedTriggers.length >= 2 ? 'high' : 
               detectedTriggers.length === 1 ? 'medium' : 'low',
  }
}

export { SHARE_TRIGGER_PATTERNS }

