/**
 * @file Shareability scoring prompt builder
 * 
 * Analyzes content for viral share potential based on Brendan Kane's frameworks
 * and corpus-derived patterns for OnlyFans creator content.
 */

// Share trigger types mapped to corpus patterns
export type ShareTrigger = 
  | 'tag_friend'         // "Send to your man" energy
  | 'self_identification' // "This is so me" reaction  
  | 'controversy_bait'    // Hot take that demands response
  | 'fantasy_projection'  // Makes viewer imagine scenario
  | 'validation_seeking'  // "Am I the only one?"
  | 'humor_share'         // Pure entertainment value
  | 'educational_value'   // "You need to see this"
  | 'aspirational'        // "Goals" energy

// Emotional responses that drive engagement
export type EmotionalResponse = 
  | 'desire'       // Sexual/romantic wanting
  | 'recognition'  // "Omg same" feeling
  | 'controversy'  // Disagreement/debate trigger
  | 'amusement'    // Laughter/entertainment
  | 'validation'   // Feeling seen/understood
  | 'curiosity'    // Need to know more
  | 'fomo'         // Fear of missing out

// Viral potential rating
export type ViralPotential = 'low' | 'medium' | 'high' | 'viral'

/**
 * Share trigger patterns derived from high-quality (0.8+) corpus entries
 * 
 * Based on analysis of which hooks and scripts generate the most engagement
 * and shareability in the target audience (male viewers).
 */
export const SHARE_TRIGGER_PATTERNS: Record<ShareTrigger, {
  description: string
  indicators: string[]
  corpus_hooks: string[]
  share_prediction_template: string
}> = {
  tag_friend: {
    description: '"Send to your man" or "tag a friend who" energy - relationship advice that men need to see',
    indicators: [
      'men should', 'men need to', 'if your man', 'ladies if', 
      'tell him', 'your boyfriend', 'if he doesn\'t'
    ],
    corpus_hooks: [
      'Ladies, if you don\'t have to ask your man to give you...',
      'Ladies, if your man takes you out on a date...',
      'If your girl is turning you down...',
      'If a man doesn\'t...',
    ],
    share_prediction_template: 'Women will tag their man or send this as a hint',
  },
  self_identification: {
    description: '"This is so me" or "omg same" reaction - relatable experiences',
    indicators: [
      'do you ever', 'am I the only one', 'I cannot be the only', 
      'pov:', 'when you', 'that feeling when', 'me when'
    ],
    corpus_hooks: [
      'Do you ever wake up from a really good dream...',
      'I cannot be the only one who thinks...',
      'Do you ever look at a man and just know...',
      'POV: you\'re explaining why...',
    ],
    share_prediction_template: 'Women will tag friends who relate or comment "me"',
  },
  controversy_bait: {
    description: 'Hot take that demands response or debate - polarizing opinions',
    indicators: [
      'I don\'t care what', 'unpopular opinion', 'I said what I said', 
      'fight me', 'I will die on this hill', 'controversial but'
    ],
    corpus_hooks: [
      'I don\'t care what people say, okay?',
      'Unpopular opinion, I guess, but...',
      'I will die on this hill.',
      'This might be controversial but...',
    ],
    share_prediction_template: 'Comments will be filled with debates and hot takes',
  },
  fantasy_projection: {
    description: 'Makes viewer imagine themselves in the scenario - desire-driven',
    indicators: [
      'I want a man who', 'imagine if', 'picture this', 
      'I need a man', 'if only', 'I just want'
    ],
    corpus_hooks: [
      'I want a man who\'s gonna...',
      'I need a man who...',
      'I just want somebody who\'s gonna...',
      'Imagine if your man...',
    ],
    share_prediction_template: 'Men will save this, women will share as "goals"',
  },
  validation_seeking: {
    description: '"Am I the only one?" or "Is this normal?" energy - seeking agreement',
    indicators: [
      'is that so hard', 'am I asking for too much', 'is this a red flag', 
      'where are the', 'why is it so hard', 'am I wrong for'
    ],
    corpus_hooks: [
      'Am I asking for too much here?',
      'Is that so hard?',
      'Where are the guys who...',
      'Why is it so hard to find...',
    ],
    share_prediction_template: 'Comments will validate with "no you\'re right" energy',
  },
  humor_share: {
    description: 'Pure entertainment/comedy value - makes people laugh',
    indicators: [
      'I-', 'bruh', 'I\'m screaming', 'dead', 
      'I can\'t', 'help', 'lmaooo', 'the way I'
    ],
    corpus_hooks: [
      'The way I just...',
      'Sir, I-',
      'Help! My pussy\'s gone crazy!',
      'I cannot-',
    ],
    share_prediction_template: 'Shares for pure entertainment, "you need to see this"',
  },
  educational_value: {
    description: '"You need to learn this" or tip/advice sharing - informational',
    indicators: [
      'here\'s how', 'the key to', 'tip:', 
      'you need to', 'this is why', 'let me teach you'
    ],
    corpus_hooks: [
      'The key to giving a really good job is...',
      'Here\'s how to make his eyes roll back...',
      'This is why you need to date a gym girl...',
      'If you want to drive him crazy...',
    ],
    share_prediction_template: 'Saved and shared as "helpful advice" to friends',
  },
  aspirational: {
    description: '"Goals" or lifestyle aspiration - relationship/life ideals',
    indicators: [
      'marriage material', 'wife him', 'that\'s a keeper', 
      'hold on to him', 'never let go', 'goals'
    ],
    corpus_hooks: [
      'That\'s marriage material right there.',
      'If you find one, don\'t let him go.',
      'You fucked up, okay? Cause now I\'m never letting you go.',
      'That\'s husband material.',
    ],
    share_prediction_template: 'Shared as relationship "goals" content',
  },
}

/**
 * Scoring rubric for viral potential assessment
 * Each dimension contributes 0-25 points for a total of 0-100
 */
export const SHAREABILITY_RUBRIC = {
  specificity: {
    weight: 25,
    description: 'How specific and vivid is the imagery?',
    levels: {
      0: 'Generic, could be said by anyone',
      10: 'Somewhat specific but still broad',
      20: 'Specific imagery that paints a picture',
      25: 'Hyper-specific details that feel real and memorable',
    },
  },
  emotional_punch: {
    weight: 25,
    description: 'How strong is the gut reaction?',
    levels: {
      0: 'No emotional response',
      10: 'Mild interest or amusement',
      20: 'Strong emotional response (laugh, desire, anger)',
      25: 'Visceral reaction that demands engagement',
    },
  },
  share_trigger: {
    weight: 25,
    description: 'Is there a clear reason to share?',
    levels: {
      0: 'No reason to share',
      10: 'Might share if reminded',
      20: 'Clear audience who would want to see this',
      25: 'Irresistible urge to share - "I need to send this"',
    },
  },
  authenticity: {
    weight: 25,
    description: 'Does it sound human and natural?',
    levels: {
      0: 'Clearly AI/scripted sounding',
      10: 'Somewhat natural but has tells',
      20: 'Sounds like real speech',
      25: 'Unmistakably authentic, like eavesdropping on real conversation',
    },
  },
}

/**
 * Build params for shareability scoring
 */
export interface ShareabilityScoringParams {
  contents: Array<{
    content: string
    content_type: 'hook' | 'script'
    index: number
  }>
}

/**
 * Build the shareability scoring prompt
 */
export function buildShareabilityScoringPrompt(params: ShareabilityScoringParams): string {
  const { contents } = params

  // Build share trigger reference
  const triggersSection = Object.entries(SHARE_TRIGGER_PATTERNS)
    .map(([trigger, data]) => `
### ${trigger.toUpperCase().replace('_', ' ')}
- ${data.description}
- Indicators: ${data.indicators.slice(0, 5).join(', ')}
- Example hook: "${data.corpus_hooks[0]}"
- Share prediction: "${data.share_prediction_template}"`)
    .join('\n')

  // Build rubric reference
  const rubricSection = Object.entries(SHAREABILITY_RUBRIC)
    .map(([dimension, data]) => `
### ${dimension.toUpperCase().replace('_', ' ')} (0-${data.weight} points)
${data.description}
- 0: ${data.levels[0]}
- ${data.weight}: ${data.levels[data.weight as keyof typeof data.levels]}`)
    .join('\n')

  // Build content list
  const contentsSection = contents
    .map((c) => `[${c.index}] [${c.content_type.toUpperCase()}] "${c.content}"`)
    .join('\n\n')

  return `You are a viral content analyst specializing in shareability prediction for OnlyFans creator content.

## YOUR TASK

Score each piece of content for viral share potential. Your audience is primarily:
- Female viewers who share content to/about their male partners
- Male viewers who save/engage with content that speaks to them

## SHARE TRIGGER PATTERNS (from corpus analysis)

${triggersSection}

## SCORING RUBRIC

Score each dimension 0-25, total 0-100:

${rubricSection}

## CONTENT TO SCORE

${contentsSection}

## OUTPUT FORMAT

Return a JSON array with one object per content piece:

\`\`\`json
[
  {
    "index": 0,
    "specificity_score": 20,
    "emotional_punch_score": 25,
    "share_trigger_score": 20,
    "authenticity_score": 15,
    "total_score": 80,
    "primary_trigger": "fantasy_projection",
    "secondary_trigger": "tag_friend",
    "emotional_response": "desire",
    "share_prediction": "Women will send to their man as a hint about what they want",
    "viral_potential": "high",
    "reasoning": "Specific fantasy imagery + direct address creates strong share motivation"
  }
]
\`\`\`

## VIRAL POTENTIAL MAPPING

- 0-30: "low" - Generic, won't spread
- 31-50: "medium" - Decent but not shareable
- 51-70: "high" - Strong share potential
- 71-100: "viral" - Irresistible to share

## EMOTIONAL RESPONSES

Choose the PRIMARY emotion triggered:
- desire: Sexual/romantic wanting
- recognition: "Omg same" identification
- controversy: Debate/disagreement
- amusement: Laughter/entertainment
- validation: Feeling seen/understood
- curiosity: Need to know more
- fomo: Fear of missing out

Score ALL ${contents.length} pieces. Return ONLY the JSON array, no markdown.`
}

/**
 * Pattern-based quick shareability estimate (no API call)
 * Returns rough score based on indicator matching
 */
export function estimateShareabilityFromPatterns(content: string): {
  estimated_score: number
  detected_triggers: ShareTrigger[]
  confidence: 'low' | 'medium' | 'high'
  strongest_trigger: ShareTrigger | null
} {
  const lowerContent = content.toLowerCase()
  const detectedTriggers: ShareTrigger[] = []
  const triggerScores: Partial<Record<ShareTrigger, number>> = {}

  // Score each trigger based on indicator matches
  for (const [trigger, data] of Object.entries(SHARE_TRIGGER_PATTERNS)) {
    const matchCount = data.indicators.filter(ind => 
      lowerContent.includes(ind.toLowerCase())
    ).length

    if (matchCount > 0) {
      detectedTriggers.push(trigger as ShareTrigger)
      triggerScores[trigger as ShareTrigger] = matchCount
    }
  }

  // Calculate base score
  let score = 35 // Baseline

  // Add points for trigger matches
  const totalMatches = Object.values(triggerScores).reduce((sum, n) => sum + n, 0)
  score += Math.min(totalMatches * 8, 30) // Max 30 points from matches

  // Bonus for multiple triggers (indicates broad appeal)
  if (detectedTriggers.length >= 2) score += 10
  if (detectedTriggers.length >= 3) score += 10

  // Bonus for specificity indicators
  const specificityIndicators = ['when he', 'when she', 'that moment', 'the way', 'imagine']
  const specificityMatches = specificityIndicators.filter(ind => 
    lowerContent.includes(ind)
  ).length
  score += specificityMatches * 5

  // Cap at 85 (can't be "viral" without human judgment)
  score = Math.min(score, 85)

  // Find strongest trigger
  let strongestTrigger: ShareTrigger | null = null
  let maxScore = 0
  for (const [trigger, triggerScore] of Object.entries(triggerScores)) {
    if (triggerScore > maxScore) {
      maxScore = triggerScore
      strongestTrigger = trigger as ShareTrigger
    }
  }

  return {
    estimated_score: score,
    detected_triggers: detectedTriggers,
    confidence: detectedTriggers.length >= 2 ? 'high' : 
               detectedTriggers.length === 1 ? 'medium' : 'low',
    strongest_trigger: strongestTrigger,
  }
}

export { SHARE_TRIGGER_PATTERNS as SHAREABILITY_PATTERNS }

