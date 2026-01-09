/**
 * @file Script expansion prompt builder
 */
import type { VoiceProfile } from '../supabase/types'
import type { CorpusMatch } from '../services/corpus-retrieval'
import type { GeneratedHook } from '../services/hook-generation'
import {
  type OrganicCTAType,
  ORGANIC_CTA_TEMPLATES,
  CTA_ANTI_PATTERNS,
  buildCTAGuidance,
  getRecommendedCTAs,
} from './organic-cta'

// Re-export OrganicCtaType with the naming convention used in this file
export type OrganicCtaType = OrganicCTAType

export type TargetDuration = 'short' | 'medium' | 'long'

// Re-export CTA constants for backward compatibility
const ORGANIC_CTA_PATTERNS = ORGANIC_CTA_TEMPLATES

export interface ScriptExpansionParams {
  modelName: string
  voiceProfile: VoiceProfile
  hooks: GeneratedHook[]
  corpusExamples: CorpusMatch[]
  targetDuration: TargetDuration
  // Kane Framework additions
  ctaType?: OrganicCtaType | 'auto' // 'auto' = AI picks best fit
}

const DURATION_GUIDELINES: Record<TargetDuration, { words: string; sentences: string; seconds: number }> = {
  short: { words: '30-45', sentences: '2-3', seconds: 12 },
  medium: { words: '45-65', sentences: '4-5', seconds: 20 },
  long: { words: '65-90', sentences: '5-7', seconds: 30 },
}

function analyzeCorpusStructure(match: CorpusMatch): string {
  const content = match.content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())

  const hook = sentences[0]?.trim() || 'Opening statement'
  const closer = sentences[sentences.length - 1]?.trim() || 'Closing statement'

  let tension = 'Builds on hook premise'
  let payload = 'Delivers main content'

  if (sentences.length > 3) {
    tension = sentences[1]?.trim().slice(0, 50) + '...' || tension
    payload = sentences.slice(2, -1).join(' ').slice(0, 80) + '...' || payload
  }

  return `- Hook: "${hook.slice(0, 60)}..."
- Tension: ${tension}
- Payload: ${payload}
- Closer: "${closer.slice(0, 60)}..."`
}

export function buildScriptExpansionPrompt(params: ScriptExpansionParams): string {
  const { modelName, voiceProfile, hooks, corpusExamples, targetDuration, ctaType = 'auto' } = params
  const duration = DURATION_GUIDELINES[targetDuration]
  
  // Build CTA guidance section
  const ctaGuidance = ctaType === 'auto' 
    ? `Pick the best-fitting organic CTA from the patterns below based on hook type and content.`
    : ctaType === 'none'
    ? `Let scripts end naturally without explicit CTA.`
    : `Use "${ctaType}" CTA pattern: ${ORGANIC_CTA_PATTERNS[ctaType].pattern}`

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

  const voiceMechanics = voiceProfile.voice_mechanics as Record<string, unknown>
  const catchphrases = (voiceMechanics?.catchphrases as string[])?.join(', ') || 'none specified'
  const sentenceStarters = (voiceMechanics?.sentence_starters as string[])?.join(', ') || 'varies'
  const fillerWords = (voiceMechanics?.filler_words as Array<{ word: string; frequency: string }>)
    ?.map((f) => `${f.word} (${f.frequency})`)
    .join(', ') || 'natural fillers'

  const parasocialStrengths = voiceProfile.parasocial_config?.strengths || voiceProfile.parasocial?.strengths || []
  const parasocialSection = parasocialStrengths
    .map((lever: string) => `- ${lever.replace(/_/g, ' ')}`)
    .join('\n')

  // CRITICAL: Parasocial levers to AVOID
  const parasocialAvoid = voiceProfile.parasocial_config?.avoid || voiceProfile.parasocial?.avoid || []
  const parasocialAvoidSection = parasocialAvoid.length > 0
    ? parasocialAvoid.map((lever: string) => `- ${lever.replace(/_/g, ' ')}`).join('\n')
    : '- None specified'

  // CRITICAL: Audience targeting data
  const audience = voiceProfile.audience as Record<string, unknown>
  const targetViewer = (audience?.target_viewer_description as string) || 'Male viewers 18-35'
  const fantasyFulfilled = (audience?.fantasy_fulfilled as string) || 'Girlfriend experience / direct attention'
  const howFansTalk = (audience?.how_fans_talk_to_her as string) || 'Not specified'

  // Extract HER sexual vocabulary (CRITICAL for authentic scripts)
  const sexualVocab = spicy?.sexual_vocabulary as Record<string, unknown> | undefined
  const bodyEuphemisms = sexualVocab?.body_part_euphemisms as Record<string, string[]> | undefined
  const actEuphemisms = sexualVocab?.act_euphemisms as Record<string, string[]> | undefined
  const signatureSpicyPhrases = (sexualVocab?.signature_spicy_phrases as string[]) || []
  
  // Build her vocabulary reference
  const herVocabSection = sexualVocab ? `
## ⚠️ ${modelName.toUpperCase()}'s VOCABULARY (USE THESE EXACT TERMS)

Body Part Terms:
- Female: ${bodyEuphemisms?.female_genitalia?.join(', ') || 'her terms'}
- Male: ${bodyEuphemisms?.male_genitalia?.join(', ') || 'his terms'}
- Breasts: ${bodyEuphemisms?.breasts?.join(', ') || 'the girls'}
- Butt: ${bodyEuphemisms?.butt_anal?.join(', ') || 'back there'}

Act Terms:
- Oral (giving): ${actEuphemisms?.oral_giving?.join(', ') || 'going down'}
- Oral (receiving): ${actEuphemisms?.oral_receiving?.join(', ') || 'eating'}
- Sex: ${actEuphemisms?.intercourse?.join(', ') || 'doing it'}
- Orgasm: ${actEuphemisms?.orgasm?.join(', ') || 'finishing'}

Her Signature Lines:
${signatureSpicyPhrases.length > 0 ? signatureSpicyPhrases.map(p => `- "${p}"`).join('\n') : '- Use her sample speech as reference'}

**USE HER VOCABULARY, NOT GENERIC TERMS**
` : ''

  const sampleSpeech = voiceProfile.sample_speech
    ?.slice(0, 5)
    .map((quote, i) => `${i + 1}. "${quote}"`)
    .join('\n') || 'No samples available'

  // Extract brand anchors (CRITICAL for unique content)
  const content = voiceProfile.content as Record<string, unknown>
  const brandAnchors = (content?.brand_anchors as string[]) || []
  
  // Extract turn-ons for fantasy content
  const turnOns = (spicy?.turn_ons_discussed as string[]) || []
  const herType = (spicy?.her_type as string) || ''
  const bedroomDynamic = (spicy?.bedroom_dynamic as string) || ''

  const boundaries = voiceProfile.boundaries as Record<string, unknown>
  const hardNos = (boundaries?.hard_nos as string[])?.join(', ') || 'none specified'
  const topicsToAvoid = (boundaries?.topics_to_avoid as string[])?.join(', ') || 'none specified'

  // Build corpus examples section
  const corpusSection = corpusExamples
    .slice(0, 8)
    .map((match, i) => {
      return `--- Example ${i + 1} ---
Hook Type: ${match.hook_type || 'mixed'}
Full Script:
"${match.content}"

Structure Analysis:
${analyzeCorpusStructure(match)}`
    })
    .join('\n\n')

  // Build hooks section
  const hooksSection = hooks
    .map((hook, i) => {
      return `${i + 1}. Hook: "${hook.hook}"
   Type: ${hook.hook_type}
   Levers: ${hook.parasocial_levers.join(', ') || 'general'}
   Why it works: ${hook.why_it_works}`
    })
    .join('\n\n')

  return `You are a viral script writer for short-form video. Expand these hooks into full scripts for ${modelName}.

## ⚠️ CRITICAL: TARGET AUDIENCE (READ THIS FIRST)

WHO IS WATCHING: ${targetViewer}

THE FANTASY SHE FULFILLS: ${fantasyFulfilled}

HOW FANS TALK TO HER: ${howFansTalk}

**THIS IS ESSENTIAL**: Every script must be written FOR male viewers who:
- Imagine being desired BY ${modelName}
- Want to feel like she's talking DIRECTLY to them
- Experience parasocial connection through her content

**DO NOT** write:
- Relationship advice FOR women
- Content that sounds like girlfriends talking
- Generic dating content that could be for anyone

**DO** write:
- Content where SHE speaks TO or ABOUT men
- Lines that make male viewers think "She's talking about ME"
- Direct address that creates intimacy with the (male) viewer
${herVocabSection}
## CREATOR VOICE PROFILE

Name: ${modelName}
Archetypes: ${archetypeMix}
Energy: ${energyLevel}
Explicitness: ${explicitnessLevel}
Humor Style: ${humorStyle}

Voice Mechanics:
- Catchphrases: ${catchphrases} - USE 0-1 per script naturally
- Sentence starters: ${sentenceStarters} - Start some sentences with these
- Filler words: ${fillerWords} - Sprinkle naturally for authenticity

Parasocial Strengths (USE THESE):
${parasocialSection}

Parasocial Levers to AVOID (DO NOT USE):
${parasocialAvoidSection}

Sample Speech (MATCH THIS EXACT VOICE):
${sampleSpeech}
${brandAnchors.length > 0 ? `
## 🏷️ BRAND ANCHORS (Her unique differentiators - USE THESE)

${brandAnchors.map(b => `- ${b}`).join('\n')}

These are things ONLY ${modelName} can talk about. Weave them into scripts naturally.
Example: If she's obsessed with Taco Bell, a script could involve Taco Bell in a fantasy scenario.
This makes content unique and impossible for other creators to copy.
` : ''}
${turnOns.length > 0 ? `
## 🔥 HER TURN-ONS (Use for specific, vivid imagery)

${turnOns.map(t => `- ${t}`).join('\n')}
${herType ? `Her type: ${herType}` : ''}
${bedroomDynamic ? `Bedroom dynamic: ${bedroomDynamic}` : ''}

Scripts should reference these SPECIFIC turn-ons, not generic desires.
` : ''}
## SCRIPT STRUCTURE FRAMEWORK

Every script follows this arc:

1. HOOK (first 3 seconds / first sentence)
   - The hook you're expanding
   - Must stop the scroll IMMEDIATELY

2. TENSION/SETUP (next 5-10 seconds)
   - Build on the hook's promise
   - Create curiosity or emotional investment
   - Use "because", "so", "the thing is"

3. PAYLOAD/PUNCHLINE (next 10-20 seconds)
   - Deliver the value, story, or twist
   - This is the "meat" of the content
   - Can be: confession, story beat, hot take explanation, relatable expansion

4. CLOSER (final 3-5 seconds)
   - Land the script with impact
   - Options: callback to hook, twist, CTA, punchline, cliffhanger
   - End strong - last line should be memorable

## CORPUS EXAMPLES (Study these structures)

${corpusSection}

## HOOKS TO EXPAND

${hooksSection}

## TARGET DURATION: ${targetDuration.toUpperCase()} (${duration.seconds} seconds)

Word count: ${duration.words} words
Sentence count: ${duration.sentences} sentences

## SCRIPT RULES

1. VOICE FIDELITY IS EVERYTHING
   - Every sentence must sound like ${modelName} said it
   - Use HER vocabulary, HER euphemisms, HER specific terms
   - Read it aloud - if it sounds scripted, rewrite it

2. SINGLE SPEECH FLOW (CRITICAL)
   - NO paragraph breaks - this is ONE continuous thought
   - NO line breaks mid-script - it should flow like real speech
   - Scripts are spoken aloud in one breath/take
   - Think: stream of consciousness, not essay structure

3. NO AI TELLS (critical)
   - No "I mean", "Honestly", "Look", "Listen" as starters (unless in her sample speech)
   - No rhetorical "right?" at end of sentences
   - No "Let me tell you", "Here's the thing"
   - No overly clean grammar - keep it conversational
   - No "boundaries", "red flags", "toxic" overuse (unless her voice uses them)

4. PARASOCIAL ACTIVATION (use 2-3 per script)
   - Direct address: Use "you" to speak TO viewer, not AT them
   - Exclusivity: Make viewer feel like they're getting insider access
   - Vulnerability: Share real feelings, not performed ones

5. BE SPECIFIC, NOT GENERIC
   - BAD: "when a guy does something hot"
   - GOOD: "when he grabs my chin and makes me look at him"
   - Specific imagery = viral, generic statements = forgettable

6. EXPLICITNESS MATCH: ${explicitnessLevel}
   ${explicitnessLevel === 'full_send' ? `
   🔥 FULL SEND MODE - Be explicit and bold:
   - Use her sexual vocabulary directly (from her spicy.sexual_vocabulary)
   - Reference specific sex acts, positions, scenarios
   - Don't censor words - if she says "fuck", write "fuck"
   - Include vivid physical descriptions
   - The corpus shows explicit scripts perform BEST for OF conversion
   - Make viewers FEEL the fantasy, not just understand it
   ` : explicitnessLevel === 'medium' ? `
   ⚡ MEDIUM MODE - Suggestive and teasing:
   - Use innuendo and euphemisms  
   - Build sexual tension without being graphic
   - Leave some things to imagination
   ` : `
   💫 SUBTLE MODE - Flirty and romantic:
   - Focus on emotional connection
   - Implied rather than stated
   - Safe for all platforms
   `}

## 🎯 VIRAL CONVERSION PATTERNS (MUST USE IN EVERY SCRIPT)

**THE VIEWER MUST FEEL CHOSEN, NOT SOLD TO**

1. **FANTASY INVITATION** - Qualify the viewer as special
   - "If you're the type who [specific behavior]... [consequence]"
   - "If you do this without being asked... marry me right now"
   - Makes viewer imagine being the person she's describing

2. **CONSEQUENCE LOCK** - Possessive closers that create attachment
   - "You fucked up, okay? Because now I'm never letting you go"
   - "Till death do us part, motherfucker"
   - Creates parasocial bond

3. **SPECIFIC DESIRE** - Her actual turn-ons, not generic statements
   - Reference her stated turn-ons from voice profile
   - Use her vocabulary for body parts and acts
   - "When he grabs my chin and whispers 'good girl'" not "when he's dominant"

4. **RHETORICAL CLOSE** - Invites agreement without asking
   - "Am I asking for too much here?"
   - "Is that so hard?"

## 🚫 SCRIPTS THAT DON'T CONVERT (AVOID THESE PATTERNS)

❌ **PERSONAL STORYTIME** - This is the #1 killer
   BAD: "So I went to Sedona and..." / "Yesterday I was at the mall..."
   WHY: Viewer can't insert themselves, they're just eavesdropping
   
❌ **LOCATION/TRAVEL STORIES** without viewer involvement
   BAD: "When I was in Paris..." / "I drove to the beach..."
   WHY: Viewer isn't there, they're excluded from the fantasy

❌ Scripts about HER being impressive (makes viewer feel inadequate)
❌ Generic relationship advice that could be anyone
❌ Content that sounds like girlfriends talking to each other
❌ Scripts that focus on her talents/achievements without viewer involvement
❌ Vague, non-specific content with no vivid imagery

## ✅ WHAT CONVERTS: VIEWER-QUALIFYING SCRIPTS

The script should make the viewer feel like:
- "She's talking about ME"
- "I could be that guy she wants"
- "She would want ME if she knew me"

**Transform any hook into this structure:**
1. [What she wants/needs in a man] - qualifies viewer
2. [Specific behavior/trait she finds irresistible] - viewer imagines being that
3. [What she would do / how she would react] - the fantasy/reward
4. [Organic closer that creates attachment]

## BOUNDARIES (DO NOT INCLUDE)

Hard nos: ${hardNos}
Avoid: ${topicsToAvoid}

## ORGANIC CLOSERS (NON-SALESY CTAs)

${ctaGuidance}

**ORGANIC CTA TYPES** (use these to build cult following, NOT promote):

1. FANTASY INVITATION: "If you're [qualifier]... I need you"
   Examples: "if you find one, don't let him go", "if you drive one of these... hit me up"

2. KEEPER SIGNAL: "That's [high value label]"
   Examples: "That's marriage material right there.", "Marry that man."

3. CONSEQUENCE LOCK: "you fucked up, okay? Because now..."
   Examples: "Cause now I'm never letting you go.", "Till death do us part."

4. RHETORICAL CLOSE: "Am I asking for too much?"
   Examples: "Is that so hard?", "I feel like I'm not asking for much."

5. OUTCOME PROMISE: "I'm telling you, [result]"
   Examples: "it drives them fucking crazy", "that man will never feel so appreciated"

6. QUALIFIER CHALLENGE: "If you're not [doing X]..."
   Examples: "you're holding yourself back", "you're not doing it right"

7. EMOTIONAL BOND: Simple connection
   Examples: "now follow me i miss you", "I need that in my life"

**⚠️ NEVER USE THESE (SALESY / PROMOTIONAL):**
${CTA_ANTI_PATTERNS.map(p => `- "${p}"`).join('\n')}

The CTA should feel like a NATURAL continuation of her speech, not a promotional ask.
It makes viewers feel CHOSEN, not sold to.

## OUTPUT FORMAT

Return a JSON array of expanded scripts:

[
  {
    "hook_index": 1,
    "hook": "The original hook text",
    "script": "The full script as ONE CONTINUOUS SPEECH FLOW with NO line breaks. Hook flows into tension flows into payload flows into closer. Like this: the hook starts here and then I keep going with the tension and building it up and then the payload hits and finally I land it with the closer okay? All one flow.",
    "word_count": 55,
    "estimated_duration_seconds": 18,
    "structure_breakdown": {
      "hook": "First sentence (from hook)",
      "tension": "What builds the intrigue",
      "payload": "The main point/punchline",
      "closer": "Final punch (last 5-10 words)"
    },
    "parasocial_levers_used": ["direct_address", "sexual_tension", "confession"],
    "voice_elements_used": ["catchphrase:example", "filler:like", "euphemism:her_term"],
    "cta_type": "fantasy_invitation|keeper_signal|consequence_lock|rhetorical_close|outcome_promise|qualifier_challenge|emotional_bond|none"
  }
]

**CRITICAL**: The "script" field must be ONE CONTINUOUS STRING with no \\n line breaks. It should read like someone speaking naturally without stopping.

**CTA REQUIREMENT**: Each script's closer should use one of the organic CTA patterns. Tag which type in "cta_type".

Expand ALL ${hooks.length} hooks. Return ONLY the JSON array, no markdown, no explanation.`
}

export { DURATION_GUIDELINES, ORGANIC_CTA_PATTERNS, CTA_ANTI_PATTERNS }
