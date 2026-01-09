import type { VoiceProfile } from '../supabase/types'
import type { CorpusMatch } from '../services/corpus-retrieval'

export interface HookGenerationParams {
  modelName: string
  voiceProfile: VoiceProfile
  corpusExamples: CorpusMatch[]
  hookTypes: string[]
  count: number
  recentHooks?: string[]
  // Kane Framework additions
  variationsPerConcept?: number // default 1 = no variations, 5 = 5 variations per concept
  enablePcmTracking?: boolean // track PCM personality type distribution
}

// PCM (Process Communication Model) personality types
export type PcmType = 'harmonizer' | 'thinker' | 'rebel' | 'persister' | 'imaginer' | 'promoter'

// PCM vocabulary patterns and hook styles
const PCM_HOOK_PATTERNS: Record<PcmType, {
  population_pct: number
  description: string
  hook_style: string
  vocabulary: string[]
  example_patterns: string[]
}> = {
  harmonizer: {
    population_pct: 30,
    description: 'Perceives world through emotions, values compassion and connection',
    hook_style: 'Emotional connection, feelings-first language',
    vocabulary: ['feel', 'love', 'care', 'connect', 'together', 'heart', 'warm'],
    example_patterns: [
      'I just want someone who makes me feel...',
      'Nothing hits harder than when he...',
      'The way I melt when...',
    ],
  },
  thinker: {
    population_pct: 25,
    description: 'Perceives world through logic and data, values facts',
    hook_style: 'Logic-based, specific data, "studies show" energy',
    vocabulary: ['actually', 'specifically', 'scientifically', 'literally', 'exactly', 'technically'],
    example_patterns: [
      'Studies show men who do X are...',
      'The actual reason why...',
      'Scientifically speaking...',
    ],
  },
  rebel: {
    population_pct: 20,
    description: 'Perceives world through reactions, values humor and spontaneity',
    hook_style: 'Humor-driven, reactions, "I-" energy',
    vocabulary: ['fucking', 'literally', 'I-', 'omg', 'bruh', 'like', 'lmao'],
    example_patterns: [
      'The way I just...',
      'I fucking CANNOT with...',
      'Why is no one talking about...',
    ],
  },
  persister: {
    population_pct: 10,
    description: 'Perceives world through opinions and values, principled',
    hook_style: 'Opinion-based, "I believe", values-driven',
    vocabulary: ['should', 'believe', 'right', 'wrong', 'deserve', 'respect', 'values'],
    example_patterns: [
      'I don\'t care what anyone says...',
      'This is what men SHOULD do...',
      'Women deserve...',
    ],
  },
  imaginer: {
    population_pct: 10,
    description: 'Perceives world through reflection and imagination',
    hook_style: 'Dreamy, imaginative, "picture this" energy',
    vocabulary: ['imagine', 'dream', 'picture', 'what if', 'fantasy', 'perfect'],
    example_patterns: [
      'Imagine if he...',
      'Picture this:...',
      'In my fantasy...',
    ],
  },
  promoter: {
    population_pct: 5,
    description: 'Perceives world through action, values charm and getting things done',
    hook_style: 'Action-oriented, direct, challenge-based',
    vocabulary: ['now', 'do', 'make', 'get', 'take', 'action', 'move'],
    example_patterns: [
      'If you want X, you need to...',
      'Stop waiting and...',
      'Real ones just...',
    ],
  },
}

// Variation strategies for A/B testing
const VARIATION_STRATEGIES = {
  angle_shift: 'Same concept, different hook type (bold_statement -> question -> confession)',
  intensity_modulation: 'Dial up/down the sexual tension or vulnerability level',
  opener_swap: 'Change the opening pattern ("I want..." vs "Why do..." vs "My toxic trait is...")',
  specificity_change: 'Make more/less specific imagery',
  lever_rotation: 'Emphasize different parasocial levers',
}

const PARASOCIAL_LEVER_DESCRIPTIONS: Record<string, string> = {
  direct_address: 'Speaking directly to the viewer as if in conversation',
  sexual_tension: 'Building anticipation and desire through suggestion',
  relatability: 'Shared experiences that trigger "omg same" reactions',
  vulnerability: 'Authentic admissions that create emotional connection',
  confession: 'Secrets or admissions that feel exclusive to the viewer',
  exclusivity: 'Making viewer feel like they\'re getting special access',
  challenge: 'Provoking or calling out the viewer directly',
  praise: 'Complimenting or validating the viewer',
  dominance: 'Taking control of the dynamic with confidence',
  playful_self_deprecation: 'Self-aware humor about own flaws',
  inside_reference: 'Callbacks that reward loyal followers',
  aspiration: 'Inspiring desire for a lifestyle or experience',
  pseudo_intimacy: 'Creating the illusion of a close relationship',
  boyfriend_fantasy: 'Playing into romantic/relationship dynamics',
  protector_dynamic: 'Making viewer feel cared for or protected',
}

const HOOK_TYPE_FRAMEWORKS: Record<string, { description: string; pattern: string; example: string }> = {
  bold_statement: {
    description: 'Provocative claim that demands attention',
    pattern: '[Unexpected claim] + [qualifier or twist]',
    example: "I'm the worst girlfriend ever. And that's why he won't leave.",
  },
  question: {
    description: 'Rhetorical or direct question that creates curiosity gap',
    pattern: 'Why do/does [specific group] always [behavior]?',
    example: 'Why do men ghost right when things get good?',
  },
  confession: {
    description: 'Vulnerable admission that feels exclusive',
    pattern: 'My [toxic trait/secret/confession] is [specific detail]',
    example: 'My toxic trait is catching feelings after one good text.',
  },
  challenge: {
    description: 'Directly challenges viewer or calls them out',
    pattern: "If you [behavior], you're [judgment]",
    example: "If you don't double-text, you don't actually like them.",
  },
  relatable: {
    description: 'Shared experience that triggers recognition',
    pattern: 'POV: [specific scenario]',
    example: "POV: You're convincing yourself he's just bad at texting",
  },
  fantasy: {
    description: 'Aspirational or desire-driven hook',
    pattern: 'I just want [specific fantasy]',
    example: 'I just want a man who [long specific list]',
  },
  hot_take: {
    description: 'Controversial opinion stated as fact',
    pattern: '[Controversial statement]. I said what I said.',
    example: "Body count doesn't matter. Emotional damage does.",
  },
  storytime: {
    description: 'Teases a story that demands completion',
    pattern: 'So I [shocking action/situation]...',
    example: 'So I accidentally sent that to my boss...',
  },
}

function analyzeCorpusHook(match: CorpusMatch): string {
  const levers = match.parasocial_levers?.join(', ') || 'general appeal'
  const hookType = match.hook_type || 'mixed'
  return `Uses ${levers} through ${hookType} pattern`
}

export function buildHookGenerationPrompt(params: HookGenerationParams): string {
  const { 
    modelName, 
    voiceProfile, 
    corpusExamples, 
    hookTypes, 
    count, 
    recentHooks,
    variationsPerConcept = 1,
    enablePcmTracking = false,
  } = params
  
  const generateVariations = variationsPerConcept > 1

  // Extract voice profile details
  const archetypeMix = Object.entries(voiceProfile.archetype_assignment?.mix || {})
    .sort(([, a], [, b]) => b - a)
    .map(([name, pct]) => `${name.replace(/_/g, ' ')}: ${Math.round(pct * 100)}%`)
    .join(', ')

  const personality = voiceProfile.personality as Record<string, unknown>
  const energyLevel = personality?.energy_level || 'medium'
  const humorStyle = personality?.humor_style || 'mixed'

  const spicy = voiceProfile.spicy as Record<string, unknown>
  const explicitnessLevel = spicy?.explicitness_level || 'medium'
  
  // Extract HER sexual vocabulary (CRITICAL for authentic hooks)
  const sexualVocab = spicy?.sexual_vocabulary as Record<string, unknown> | undefined
  const bodyEuphemisms = sexualVocab?.body_part_euphemisms as Record<string, string[]> | undefined
  const actEuphemisms = sexualVocab?.act_euphemisms as Record<string, string[]> | undefined
  const signatureSpicyPhrases = (sexualVocab?.signature_spicy_phrases as string[]) || []
  
  // Build her vocabulary reference
  const herVocabSection = sexualVocab ? `
## ⚠️ ${modelName.toUpperCase()}'s SPECIFIC VOCABULARY (USE THESE EXACT TERMS)

Body Part Terms SHE Uses:
- Female parts: ${bodyEuphemisms?.female_genitalia?.join(', ') || 'not specified'}
- Male parts: ${bodyEuphemisms?.male_genitalia?.join(', ') || 'not specified'}
- Breasts: ${bodyEuphemisms?.breasts?.join(', ') || 'not specified'}
- Butt/Anal: ${bodyEuphemisms?.butt_anal?.join(', ') || 'not specified'}

Act Terms SHE Uses:
- Oral (giving): ${actEuphemisms?.oral_giving?.join(', ') || 'not specified'}
- Oral (receiving): ${actEuphemisms?.oral_receiving?.join(', ') || 'not specified'}
- Sex: ${actEuphemisms?.intercourse?.join(', ') || 'not specified'}
- Orgasm: ${actEuphemisms?.orgasm?.join(', ') || 'not specified'}
- Masturbation: ${actEuphemisms?.masturbation?.join(', ') || 'not specified'}

Her Signature Spicy Phrases:
${signatureSpicyPhrases.length > 0 ? signatureSpicyPhrases.map(p => `- "${p}"`).join('\n') : '- None identified yet'}

**CRITICAL**: Use HER terms, not generic/corpus terms. If she says "kitty", don't write "pink taco". If she says "going down", don't write "munching". Her voice = her vocabulary.
` : ''

  const voiceMechanics = voiceProfile.voice_mechanics as Record<string, unknown>
  const catchphrases = (voiceMechanics?.catchphrases as string[])?.join(', ') || 'none specified'
  const sentenceStarters = (voiceMechanics?.sentence_starters as string[])?.join(', ') || 'varies'
  const fillerWords = (voiceMechanics?.filler_words as Array<{ word: string; frequency: string }>)
    ?.map((f) => f.word)
    .join(', ') || 'natural fillers'

  // Extract audience targeting (CRITICAL for parasocial content)
  const audience = voiceProfile.audience as Record<string, unknown>
  const targetViewer = (audience?.target_viewer_description as string) || 'Male viewers 18-35'
  const fantasyFulfilled = (audience?.fantasy_fulfilled as string) || 'Girlfriend experience / direct attention'
  const howFansTalk = (audience?.how_fans_talk_to_her as string) || 'Not specified'

  // Extract parasocial config - both strengths AND avoid
  const parasocialStrengths = voiceProfile.parasocial_config?.strengths || voiceProfile.parasocial?.strengths || []
  const parasocialAvoid = voiceProfile.parasocial_config?.avoid || voiceProfile.parasocial?.avoid || []
  
  const parasocialSection = parasocialStrengths
    .map((lever: string) => `- ${lever.replace(/_/g, ' ')}: ${PARASOCIAL_LEVER_DESCRIPTIONS[lever] || 'Engage authentically'}`)
    .join('\n')

  const parasocialAvoidSection = parasocialAvoid.length > 0
    ? parasocialAvoid.map((lever: string) => `- ${lever.replace(/_/g, ' ')}`).join('\n')
    : '- None specified'

  const sampleSpeech = voiceProfile.sample_speech
    ?.slice(0, 5)
    .map((quote, i) => `${i + 1}. "${quote}"`)
    .join('\n') || 'No samples available'

  const boundaries = voiceProfile.boundaries as Record<string, unknown>
  const hardNos = (boundaries?.hard_nos as string[])?.join(', ') || 'none specified'
  const topicsToAvoid = (boundaries?.topics_to_avoid as string[])?.join(', ') || 'none specified'

  // Build corpus examples section - FOR STRUCTURE PATTERNS ONLY
  const corpusSection = corpusExamples
    .slice(0, 10)
    .map((match, i) => {
      // Extract just the structure pattern, not the specific vocabulary
      const hookLength = (match.hook || match.content.split('.')[0]).split(' ').length
      return `${i + 1}. Hook Type: ${match.hook_type || 'mixed'} (${hookLength} words)
   Structure: "${match.hook || match.content.split('.')[0]}"
   Pattern: ${analyzeCorpusHook(match)}
   Levers: ${match.parasocial_levers?.join(', ') || 'general'}`
    })
    .join('\n\n')

  // Build hook type distribution
  const hooksPerType = Math.ceil(count / hookTypes.length)
  const typeDistribution = hookTypes
    .map((type) => `- ${type}: ${hooksPerType} hooks`)
    .join('\n')

  // Build hook frameworks section
  const frameworksSection = hookTypes
    .filter((type) => HOOK_TYPE_FRAMEWORKS[type])
    .map((type) => {
      const fw = HOOK_TYPE_FRAMEWORKS[type]
      return `${type.toUpperCase()}:
   ${fw.description}
   Pattern: "${fw.pattern}"
   Example: "${fw.example}"`
    })
    .join('\n\n')

  // Recent hooks to avoid
  const recentHooksSection = recentHooks?.length
    ? recentHooks.map((h) => `- "${h}"`).join('\n')
    : 'None - this is the first batch'

  // Build audience targeting section (CRITICAL for correct content direction)
  const audienceSection = `
## ⚠️ CRITICAL: TARGET AUDIENCE (READ THIS CAREFULLY)

WHO IS WATCHING: ${targetViewer}

THE FANTASY SHE FULFILLS: ${fantasyFulfilled}

HOW FANS TALK TO HER: ${howFansTalk}

**IMPORTANT**: These hooks are for MALE viewers who imagine being desired BY ${modelName}.
- DO NOT write relationship advice FOR women
- DO NOT write content that sounds like a woman talking to her girlfriends
- DO write content where SHE is speaking TO or ABOUT men in a way that makes male viewers feel seen
- The viewer should imagine: "She's talking about ME" or "I wish she'd say this to ME"
`

  return `You are a viral hook writer for short-form video content. Generate ${count} unique hooks for ${modelName}.
${audienceSection}
${herVocabSection}
## CREATOR VOICE PROFILE

Archetypes: ${archetypeMix}
Energy: ${energyLevel}
Explicitness: ${explicitnessLevel}
Humor Style: ${humorStyle}

Parasocial Strengths (USE THESE):
${parasocialSection}

Parasocial Levers to AVOID (DO NOT USE):
${parasocialAvoidSection}

Voice Mechanics:
- Catchphrases: ${catchphrases}
- Sentence starters: ${sentenceStarters}
- Filler words: ${fillerWords}

Sample Speech (MATCH THIS VOICE):
${sampleSpeech}

## VIRAL HOOK STRUCTURE PATTERNS (from corpus)

Study these STRUCTURE PATTERNS - the hook type, word count, lever combinations that work.
**DO NOT copy the vocabulary** - use ${modelName}'s vocabulary instead.

${corpusSection}

## HOOK TYPE DISTRIBUTION

Generate hooks in these categories:
${typeDistribution}

## HOOK FRAMEWORKS

${frameworksSection}

## RULES

1. Each hook must be 5-12 words (shorter = better, viral hooks are PUNCHY)
2. First 3 words are CRITICAL - they determine if someone stops scrolling
3. Use ${modelName}'s EXACT vocabulary - her euphemisms, her terms, her phrases
4. Include her catchphrases or sentence starters where natural
5. Match her explicitness level: ${explicitnessLevel}
6. Activate 2-3 parasocial strengths per hook (top performers combine multiple levers)
7. NO generic hooks - must feel like ONLY she would say it
8. Be SPECIFIC - "soaked from his voice" not "turned on by him"
9. Vary the structure - don't repeat the same pattern
10. NO hashtags, NO emojis, NO stage directions

## HOOK QUALITY CHECKLIST (each hook must pass ALL)

✓ Uses HER vocabulary (not corpus vocabulary)
✓ Has specific imagery (not generic statements)
✓ 5-12 words max
✓ Creates immediate curiosity/intrigue
✓ Combines 2-3 parasocial levers
✓ Would make someone stop scrolling
✓ Only SHE would say this exact thing

## AVOID (per model boundaries)

Hard nos: ${hardNos}
Topics to avoid: ${topicsToAvoid}

## HOOKS TO AVOID (already used)

${recentHooksSection}

## OUTPUT FORMAT

${generateVariations ? `
## VARIATION GENERATION MODE

You are generating ${Math.ceil(count / variationsPerConcept)} CONCEPTS, each with ${variationsPerConcept} VARIATIONS.

For each concept, create variations using these strategies:
- Angle Shift: Same idea, different hook type (bold_statement -> question -> confession)  
- Intensity Modulation: Vary the boldness/vulnerability level
- Opener Swap: "I want..." vs "Why do..." vs "My toxic trait is..."
- Specificity: More/less specific imagery

Return a JSON array with concept groups:

[
  {
    "concept_id": "unique_concept_identifier",
    "concept": "Brief description of the hook concept",
    "variations": [
      {
        "hook": "The actual hook text - variation 1",
        "hook_type": "bold_statement",
        "parasocial_levers": ["lever1", "lever2"],
        "why_it_works": "Why this variation works",
        "variation_strategy": "angle_shift|intensity_modulation|opener_swap|specificity_change",
        "pcm_type": "harmonizer|thinker|rebel|persister|imaginer|promoter"
      },
      {
        "hook": "Same concept - variation 2 (different angle)",
        "hook_type": "question",
        "parasocial_levers": ["lever1", "lever3"],
        "why_it_works": "Why this different angle works",
        "variation_strategy": "opener_swap",
        "pcm_type": "rebel"
      }
    ],
    "recommended_for_testing": ["variation_index_0", "variation_index_2"]
  }
]

Generate ${Math.ceil(count / variationsPerConcept)} concepts with ${variationsPerConcept} variations each (${count} total hooks).
` : `
Return a JSON array of hook objects:

[
  {
    "hook": "The actual hook text",
    "hook_type": "bold_statement|question|confession|challenge|relatable|fantasy|hot_take|storytime",
    "parasocial_levers": ["lever1", "lever2"],
    "why_it_works": "One sentence on why this hook fits her voice and will stop scrolls"${enablePcmTracking ? `,
    "pcm_type": "harmonizer|thinker|rebel|persister|imaginer|promoter"` : ''}
  }
]

Generate exactly ${count} hooks.`}
${enablePcmTracking ? `

## PCM DISTRIBUTION REQUIREMENT

Ensure hooks are distributed across personality types:
- Harmonizers (30%): ${Math.round(count * 0.30)} hooks - emotional, feelings-first
- Thinkers (25%): ${Math.round(count * 0.25)} hooks - logical, specific facts
- Rebels (20%): ${Math.round(count * 0.20)} hooks - humor, reactions
- Persisters (10%): ${Math.round(count * 0.10)} hooks - opinions, values
- Imaginers (10%): ${Math.round(count * 0.10)} hooks - dreamy, imaginative
- Promoters (5%): ${Math.round(count * 0.05)} hooks - action-oriented

Tag each hook with its primary PCM type based on the language used.
` : ''}

Return ONLY the JSON, no markdown, no explanation.`
}

export { HOOK_TYPE_FRAMEWORKS, PARASOCIAL_LEVER_DESCRIPTIONS, PCM_HOOK_PATTERNS, VARIATION_STRATEGIES }
