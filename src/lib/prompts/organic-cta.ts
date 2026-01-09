/**
 * @file Organic CTA prompt builder
 * 
 * Creates natural, parasocial call-to-actions that build cult following
 * without sounding salesy or promotional. Based on corpus analysis of
 * successful closers from viral OnlyFans creator content.
 */

/**
 * Organic CTA types - these feel like natural conversation, not promotion
 * 
 * KEY PRINCIPLE: CTAs should make viewers feel CHOSEN, not sold to.
 * The goal is cult-building through parasocial connection, not conversion.
 */
export type OrganicCTAType = 
  | 'fantasy_invitation'   // "If you're like this... I need you"
  | 'qualifier_challenge'  // "If you do this... marry me"
  | 'exclusivity_signal'   // "The ones who get it... get it"
  | 'direct_desire'        // "If you drive one of these... hit me up"
  | 'loyalty_reward'       // "My day ones know..."
  | 'consequence_lock'     // "you fucked up, cause now I'm never letting go"
  | 'rhetorical_close'     // "Am I asking for too much?"
  | 'outcome_promise'      // "I'm telling you, [result]"
  | 'emotional_bond'       // "now follow me i miss you"
  | 'none'                 // Let script end naturally

/**
 * Organic CTA templates derived from corpus closer analysis
 * 
 * These are the ACTUAL patterns that work - extracted from high-performing
 * scripts in the corpus. Each template includes:
 * - Pattern: The structure/formula
 * - Templates: Fill-in-the-blank versions
 * - Corpus examples: Real examples from top content
 * - Voice integration notes: How to adapt to model voice
 */
export const ORGANIC_CTA_TEMPLATES: Record<OrganicCTAType, {
  description: string
  pattern: string
  templates: string[]
  corpus_examples: string[]
  voice_integration: string
  use_when: string
}> = {
  fantasy_invitation: {
    description: 'Makes viewer feel chosen by qualifying them for a fantasy',
    pattern: 'If you\'re [specific qualifier]... [I need you / I\'ve been looking / hit me up]',
    templates: [
      'If you\'re the type who [specific trait]... I\'ve been looking for you',
      'If you\'re [rare quality]... hit me up',
      'The ones who [behavior]... I need you in my life',
      'If you do [specific thing]... where have you been?',
    ],
    corpus_examples: [
      'if you find one, don\'t let him go',
      'if you\'re that type of guy... hit me up',
      'if you drive one of these... I need you',
      'if you do this without being asked... marry me',
    ],
    voice_integration: 'Use model\'s specific vocabulary for traits/qualities she values',
    use_when: 'Hook is about desire, fantasy, or ideal partner traits',
  },
  qualifier_challenge: {
    description: 'Challenges viewer to prove they\'re worthy of her attention',
    pattern: 'If you [do/don\'t do X]... [judgment/reward]',
    templates: [
      'If you\'re not [doing X]... you\'re holding yourself back',
      'If you [behavior]... you\'re doing it right',
      'The ones who [action]... they get it',
      'If you can\'t [simple thing]... we\'re not gonna work',
    ],
    corpus_examples: [
      'you\'re holding yourself back from your true potential',
      'you\'re not doing it right',
      'you don\'t actually like them',
      'if you can\'t handle [X], don\'t waste my time',
    ],
    voice_integration: 'Match model\'s level of directness/sassiness',
    use_when: 'Hook is a challenge, hot take, or opinion-based',
  },
  exclusivity_signal: {
    description: 'Creates in-group feeling for those who "get it"',
    pattern: 'The ones who [understand/get it]... [insider reward]',
    templates: [
      'The ones who get it... get it',
      'If you know, you know',
      'This is for the ones who [understand X]',
      'My real ones know exactly what I mean',
    ],
    corpus_examples: [
      'if you know you know',
      'iykyk',
      'the ones who get it will understand',
      'my people know what I\'m talking about',
    ],
    voice_integration: 'Use model\'s in-group language and inside references',
    use_when: 'Content references shared experiences or niche knowledge',
  },
  direct_desire: {
    description: 'Directly expresses wanting the viewer who fits the description',
    pattern: 'If you [trait/action]... [direct want statement]',
    templates: [
      'If you\'re [specific type]... I want you',
      'Men who [behavior]... come find me',
      'If this is you... hi, I\'m single',
      'The ones who [trait]... where are you hiding?',
    ],
    corpus_examples: [
      'if you\'re like this... hi, how are you?',
      'men who do this... where are you?',
      'if this is you... we should talk',
      'come find me',
    ],
    voice_integration: 'Match model\'s flirtation style and boldness level',
    use_when: 'Hook is about attraction, turn-ons, or ideal man traits',
  },
  loyalty_reward: {
    description: 'Rewards loyal followers with insider content/connection',
    pattern: 'My [day ones/real ones/regulars]... [exclusive callback]',
    templates: [
      'My day ones know...',
      'If you\'ve been here from the start...',
      'For the ones who always show up...',
      'You know I love you for being here',
    ],
    corpus_examples: [
      'now follow me i miss you',
      'my day ones know what\'s up',
      'for the ones who\'ve been here... thank you',
      'i love you guys so much',
    ],
    voice_integration: 'Use model\'s terms of endearment and fan language',
    use_when: 'Building community, rewarding engagement, or expressing gratitude',
  },
  consequence_lock: {
    description: 'Playful possessiveness - "now you\'re stuck with me"',
    pattern: 'You [action that triggered this]... [possessive consequence]',
    templates: [
      'You fucked up, okay? Because now [possessive statement]',
      'That\'s it, you\'re stuck with me now',
      'Now you\'ve done it... [consequence]',
      'Till death do us part, motherfucker',
    ],
    corpus_examples: [
      'Cause now I\'m never letting you go',
      'You\'re not going anywhere',
      'till death do us part',
      'you fucked up cause now you\'re mine',
    ],
    voice_integration: 'Match model\'s intensity and humor style',
    use_when: 'Hook is about catching feelings, finding "the one", or boyfriend material',
  },
  rhetorical_close: {
    description: 'Ends with question that validates the content and invites agreement',
    pattern: '[Rhetorical question that audience will answer "no" or "yes" to]',
    templates: [
      'Am I asking for too much?',
      'Is that so hard?',
      'Why is that so difficult?',
      'I feel like I\'m not asking for much here',
    ],
    corpus_examples: [
      'Am I asking for too much here?',
      'Is that so hard?',
      'Like, is this really that unreasonable?',
      'tell me I\'m not crazy',
    ],
    voice_integration: 'Use model\'s typical question patterns',
    use_when: 'Hook is about standards, expectations, or things she wants',
  },
  outcome_promise: {
    description: 'Promises the result if viewer does what she described',
    pattern: 'I\'m telling you, [result] / Trust me, [outcome]',
    templates: [
      'I\'m telling you, [specific result]',
      'I promise you, [outcome they want]',
      'Trust me, it works',
      'He won\'t know what hit him',
    ],
    corpus_examples: [
      'I\'m telling you, it drives them fucking crazy',
      'I promise you, that man will never feel so appreciated',
      'Trust me, he\'s not lasting',
      'he\'ll be obsessed',
    ],
    voice_integration: 'Use model\'s confidence level and promise style',
    use_when: 'Hook is educational, tips-based, or "how to" content',
  },
  emotional_bond: {
    description: 'Simple, direct emotional connection - parasocial relationship building',
    pattern: '[Simple emotional statement]',
    templates: [
      'now follow me i miss you',
      'I love you guys',
      'That\'s all I want',
      'I need that in my life',
    ],
    corpus_examples: [
      'now follow me i miss you',
      'I need that',
      'That\'s all I want',
      'seriously though, i love you',
    ],
    voice_integration: 'Use model\'s vulnerability level and emotional openness',
    use_when: 'Content is vulnerable, confessional, or relationship-focused',
  },
  none: {
    description: 'Let the script end naturally without explicit CTA',
    pattern: 'End on the punchline or natural conclusion',
    templates: [
      'It\'s the only way to do it',
      'That\'s how I like it',
      'I don\'t make the rules',
      '[Punchline that lands without needing more]',
    ],
    corpus_examples: [
      'I don\'t make the rules',
      'it is what it is',
      'that\'s just facts',
      'anyway',
    ],
    voice_integration: 'Match model\'s natural conversation endings',
    use_when: 'Script already has strong closer, or CTA would feel forced',
  },
}

/**
 * ANTI-PATTERNS: CTAs that should NEVER be used
 * 
 * These sound promotional, salesy, and break the parasocial illusion.
 * Using these will make content feel like an ad, not authentic connection.
 */
export const CTA_ANTI_PATTERNS = [
  // Promotional language
  'Link in bio',
  'Follow for more',
  'Subscribe to my',
  'Check out my',
  'Click the link',
  'Swipe up',
  'See more on',
  
  // Forced engagement asks
  'Don\'t forget to follow',
  'Make sure to like',
  'Comment below',
  'Let me know in the comments',
  'Share this with',
  'Tag a friend who',
  
  // Sales language
  'Limited time',
  'Don\'t miss out',
  'Subscribe now',
  'Join my',
  'Get access to',
  
  // Generic influencer CTAs
  'Hit that follow button',
  'Turn on notifications',
  'Like and subscribe',
  'Follow for part 2',
]

/**
 * CTA selection guide based on hook type and content
 */
export const CTA_SELECTION_GUIDE: Record<string, OrganicCTAType[]> = {
  // Hook types -> recommended CTAs
  bold_statement: ['qualifier_challenge', 'rhetorical_close', 'exclusivity_signal'],
  question: ['rhetorical_close', 'fantasy_invitation', 'emotional_bond'],
  confession: ['emotional_bond', 'consequence_lock', 'rhetorical_close'],
  challenge: ['qualifier_challenge', 'direct_desire', 'exclusivity_signal'],
  relatable: ['emotional_bond', 'exclusivity_signal', 'rhetorical_close'],
  fantasy: ['fantasy_invitation', 'direct_desire', 'outcome_promise'],
  hot_take: ['qualifier_challenge', 'rhetorical_close', 'none'],
  storytime: ['consequence_lock', 'outcome_promise', 'emotional_bond'],
  
  // Parasocial levers -> recommended CTAs
  sexual_tension: ['fantasy_invitation', 'direct_desire', 'outcome_promise'],
  vulnerability: ['emotional_bond', 'rhetorical_close', 'loyalty_reward'],
  direct_address: ['fantasy_invitation', 'direct_desire', 'emotional_bond'],
  exclusivity: ['exclusivity_signal', 'loyalty_reward', 'consequence_lock'],
  challenge: ['qualifier_challenge', 'direct_desire', 'exclusivity_signal'],
}

/**
 * Parameters for CTA injection
 */
export interface CTAInjectionParams {
  hookType: string
  parasocialLevers: string[]
  scriptContent: string
  preferredCtaType?: OrganicCTAType | 'auto'
  modelVoiceTraits?: {
    energy_level: 'high' | 'medium' | 'low'
    humor_style: string
    explicitness_level: 'subtle' | 'medium' | 'full_send'
    typical_closers?: string[]
  }
}

/**
 * Get recommended CTA types based on hook and levers
 */
export function getRecommendedCTAs(
  hookType: string,
  parasocialLevers: string[]
): OrganicCTAType[] {
  const recommendations = new Set<OrganicCTAType>()
  
  // Get CTAs from hook type
  const hookCTAs = CTA_SELECTION_GUIDE[hookType] || []
  hookCTAs.forEach(cta => recommendations.add(cta))
  
  // Get CTAs from parasocial levers
  for (const lever of parasocialLevers) {
    const leverCTAs = CTA_SELECTION_GUIDE[lever] || []
    leverCTAs.forEach(cta => recommendations.add(cta))
  }
  
  // If no matches, return defaults
  if (recommendations.size === 0) {
    return ['fantasy_invitation', 'emotional_bond', 'none']
  }
  
  return Array.from(recommendations)
}

/**
 * Build CTA injection guidance for script expansion prompt
 */
export function buildCTAGuidance(params: CTAInjectionParams): string {
  const { hookType, parasocialLevers, preferredCtaType, modelVoiceTraits } = params
  
  // Get recommended CTAs
  const recommendedCTAs = preferredCtaType === 'auto' || !preferredCtaType
    ? getRecommendedCTAs(hookType, parasocialLevers)
    : [preferredCtaType]
  
  // Build templates section
  const templatesSection = recommendedCTAs
    .filter(cta => cta !== 'none')
    .map(cta => {
      const data = ORGANIC_CTA_TEMPLATES[cta]
      return `
### ${cta.toUpperCase().replace('_', ' ')}
${data.description}
Pattern: ${data.pattern}
Examples:
${data.templates.slice(0, 2).map(t => `- "${t}"`).join('\n')}
Use when: ${data.use_when}`
    })
    .join('\n')
  
  // Build anti-patterns warning
  const antiPatternsSection = CTA_ANTI_PATTERNS
    .slice(0, 10)
    .map(ap => `- "${ap}"`)
    .join('\n')
  
  // Build voice adaptation notes
  const voiceNotes = modelVoiceTraits ? `
## VOICE ADAPTATION

Energy: ${modelVoiceTraits.energy_level}
Humor: ${modelVoiceTraits.humor_style}
Explicitness: ${modelVoiceTraits.explicitness_level}
${modelVoiceTraits.typical_closers?.length ? `Her typical closers: ${modelVoiceTraits.typical_closers.join(', ')}` : ''}

Match her energy and style in the CTA.` : ''

  return `## ORGANIC CLOSER (CTA)

The closer should feel like a NATURAL continuation of her speech, not a promotional ask.
It should make viewers feel CHOSEN, not sold to.

## RECOMMENDED CTA TYPES FOR THIS CONTENT

${templatesSection}

${voiceNotes}

## ⚠️ NEVER USE THESE (SALESY / PROMOTIONAL)

${antiPatternsSection}

## CTA RULES

1. CTA must flow naturally from the script content
2. Should feel like conversation, not promotion
3. Creates parasocial connection, not conversion pressure
4. Makes viewer feel special/chosen, not targeted
5. Match her exact voice - this IS her, not a template`
}

export { ORGANIC_CTA_TEMPLATES as CTA_TEMPLATES }

