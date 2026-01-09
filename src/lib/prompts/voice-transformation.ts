/**
 * @file Voice transformation prompt builder
 */
import type { VoiceProfile } from '../supabase/types'
import type { ExpandedScript } from '../services/script-expansion'

export interface VoiceTransformationParams {
  modelName: string
  voiceProfile: VoiceProfile
  scripts: ExpandedScript[]
  sampleSpeechExtended?: string[]
}

function analyzeVoicePatterns(voiceProfile: VoiceProfile): string {
  const samples = voiceProfile.sample_speech || []
  if (samples.length === 0) return 'No samples available for analysis'

  // Analyze sentence length
  const avgWords = samples.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / samples.length
  const lengthStyle = avgWords > 20 ? 'longer, rambling sentences' : avgWords > 12 ? 'medium-length sentences' : 'short, punchy sentences'

  // Look for patterns
  const hasQuestions = samples.some((s) => s.includes('?'))
  const hasExclamations = samples.some((s) => s.includes('!'))
  const hasTrailingOff = samples.some((s) => s.includes('...'))

  const patterns: string[] = []
  patterns.push(`Sentence style: ${lengthStyle}`)
  if (hasQuestions) patterns.push('Uses rhetorical questions')
  if (hasExclamations) patterns.push('Uses exclamation points for emphasis')
  if (hasTrailingOff) patterns.push('Trails off with "..."')

  return patterns.join('\n- ')
}

export function buildVoiceTransformationPrompt(params: VoiceTransformationParams): string {
  const { modelName, voiceProfile, scripts, sampleSpeechExtended } = params

  // Extract voice profile details
  const archetypeMix = voiceProfile.archetype_assignment?.mix || {}
  const sortedArchetypes = Object.entries(archetypeMix)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const primaryArchetype = sortedArchetypes[0]?.[0]?.replace(/_/g, ' ') || 'unknown'
  const primaryPct = sortedArchetypes[0]?.[1] ? Math.round(sortedArchetypes[0][1] * 100) : 0
  const secondaryArchetype = sortedArchetypes[1]?.[0]?.replace(/_/g, ' ') || 'none'
  const secondaryPct = sortedArchetypes[1]?.[1] ? Math.round(sortedArchetypes[1][1] * 100) : 0

  const personality = voiceProfile.personality as Record<string, unknown>
  const energyLevel = personality?.energy_level || 'medium'
  const humorStyle = personality?.humor_style || 'mixed'

  const spicy = voiceProfile.spicy as Record<string, unknown>
  const explicitnessLevel = spicy?.explicitness_level || 'medium'

  // Extract HER sexual vocabulary (CRITICAL for authentic transformation)
  const sexualVocab = spicy?.sexual_vocabulary as Record<string, unknown> | undefined
  const bodyEuphemisms = sexualVocab?.body_part_euphemisms as Record<string, string[]> | undefined
  const actEuphemisms = sexualVocab?.act_euphemisms as Record<string, string[]> | undefined
  const signatureSpicyPhrases = (sexualVocab?.signature_spicy_phrases as string[]) || []

  // Voice mechanics
  const voiceMechanics = voiceProfile.voice_mechanics as Record<string, unknown>
  const fillerWords = (voiceMechanics?.filler_words as Array<{ word: string; frequency: string }>) || []
  const fillerList = fillerWords.map((f) => `"${f.word}" (${f.frequency})`).join(', ') || 'natural fillers'
  const fillerSimple = fillerWords.map((f) => f.word).join(', ') || 'um, like'

  const sentenceStarters = (voiceMechanics?.sentence_starters as string[])?.join(', ') || 'varies'
  const catchphrases = (voiceMechanics?.catchphrases as string[])?.join(', ') || 'none identified'

  // Sample speech
  const allSamples = [
    ...(voiceProfile.sample_speech || []),
    ...(sampleSpeechExtended || []),
  ].slice(0, 8)

  const sampleSpeechSection = allSamples
    .map((quote, i) => `${i + 1}. "${quote}"`)
    .join('\n')

  // Parasocial config
  const parasocialStrengths = voiceProfile.parasocial_config?.strengths || voiceProfile.parasocial?.strengths || []
  const parasocialAvoid = voiceProfile.parasocial_config?.avoid || voiceProfile.parasocial?.avoid || []

  const strengthsSection = parasocialStrengths
    .map((s: string) => {
      const descriptions: Record<string, string> = {
        direct_address: 'Speak TO the viewer, use "you" frequently',
        vulnerability: 'Share real feelings, admit flaws authentically',
        confession: 'Make viewer feel like they\'re getting secrets',
        relatability: 'Reference shared experiences, "omg same" moments',
        playful_self_deprecation: 'Make fun of herself in an endearing way',
        pseudo_intimacy: 'Create feeling of close relationship',
        boyfriend_fantasy: 'Lean into romantic/relationship dynamics',
        sexual_tension: 'Build anticipation and desire through suggestion',
        exclusivity: 'Make viewer feel like they\'re getting special access',
        protector_dynamic: 'Let viewer feel like he could take care of her',
      }
      return `- ${s.replace(/_/g, ' ')}: ${descriptions[s] || 'Use authentically'}`
    })
    .join('\n')

  // CRITICAL: Audience targeting data
  const audience = voiceProfile.audience as Record<string, unknown>
  const targetViewer = (audience?.target_viewer_description as string) || 'Male viewers 18-35'
  const fantasyFulfilled = (audience?.fantasy_fulfilled as string) || 'Girlfriend experience / direct attention'

  // Energy description
  const energyDescription =
    energyLevel === 'high'
      ? 'Fast, excitable, uses exclamation points, sentences can run together'
      : energyLevel === 'low'
        ? 'Relaxed, measured, thoughtful pauses, chill vibe'
        : 'Medium energy, varies based on topic'

  // Voice patterns analysis
  const voicePatterns = analyzeVoicePatterns(voiceProfile)

  // Scripts section
  const scriptsSection = scripts
    .map((script, i) => {
      return `---
Script ${i + 1}
Original Hook: "${script.hook}"
Current Script:
"${script.script}"

Word count: ${script.word_count}
Target: Maintain similar length (±10 words)
---`
    })
    .join('\n\n')

  // Build her vocabulary section
  const herVocabSection = sexualVocab ? `
## ⚠️ HER EXACT VOCABULARY (REPLACE GENERIC TERMS WITH THESE)

Body Parts - USE HER TERMS:
- Female parts: ${bodyEuphemisms?.female_genitalia?.join(', ') || 'her terms from samples'}
- Male parts: ${bodyEuphemisms?.male_genitalia?.join(', ') || 'his terms from samples'}
- Breasts: ${bodyEuphemisms?.breasts?.join(', ') || 'the girls'}
- Butt/Anal: ${bodyEuphemisms?.butt_anal?.join(', ') || 'back there'}

Acts - USE HER TERMS:
- Oral (giving): ${actEuphemisms?.oral_giving?.join(', ') || 'going down'}
- Oral (receiving): ${actEuphemisms?.oral_receiving?.join(', ') || 'eating'}
- Sex: ${actEuphemisms?.intercourse?.join(', ') || 'doing it'}
- Orgasm: ${actEuphemisms?.orgasm?.join(', ') || 'finishing'}
- Masturbation: ${actEuphemisms?.masturbation?.join(', ') || 'playing with myself'}

Her Signature Spicy Lines:
${signatureSpicyPhrases.length > 0 ? signatureSpicyPhrases.map(p => `- "${p}"`).join('\n') : '- Reference her sample speech'}

**IF THE SCRIPT USES GENERIC TERMS, REPLACE THEM WITH HER TERMS**
` : ''

  return `You are a voice transformation specialist. Your job is to take these scripts and rewrite them so they sound EXACTLY like ${modelName} wrote them herself.

## 🔴🔴🔴 RULE #1: PRESERVE THE HOOK OPENER (NON-NEGOTIABLE) 🔴🔴🔴

**THE FIRST 3-5 WORDS OF EACH SCRIPT MUST MATCH THE ORIGINAL HOOK OPENER.**

❌ WRONG (you keep doing this):
- Original hook: "I need a man who..." → Transformed: "Okay so like, I need a man..."
- Original hook: "Do you ever..." → Transformed: "Okay so like, do you ever..."
- Original hook: "My toxic trait..." → Transformed: "So like, my toxic trait..."

✅ CORRECT:
- Original hook: "I need a man who..." → Transformed: "I need a man who like..."
- Original hook: "Do you ever..." → Transformed: "Do you ever like..."
- Original hook: "My toxic trait..." → Transformed: "My toxic trait is that like..."

**HER FILLER WORDS ("okay so like", "um", "like") GO INSIDE THE SCRIPT, NOT AT THE BEGINNING.**

If you start a script with "Okay so like" when the hook doesn't start that way, you have FAILED.

This is the most critical stage. Every word must pass the "would she actually say this?" test.

## ⚠️ CRITICAL: TARGET AUDIENCE

WHO IS WATCHING: ${targetViewer}
THE FANTASY SHE FULFILLS: ${fantasyFulfilled}

**REMEMBER**: These scripts are for MALE viewers who imagine being desired BY ${modelName}.
- Every script should make a male viewer feel like she's talking TO him
- The viewer should think: "She's talking about ME" or "I wish she'd say this to ME"
- DO NOT write content that sounds like women talking to girlfriends
- DO NOT write generic relationship advice
${herVocabSection}
## ${modelName.toUpperCase()}'s VOICE DNA

### Identity
Name: ${modelName}
Primary Archetype: ${primaryArchetype} (${primaryPct}%)
Secondary: ${secondaryArchetype} (${secondaryPct}%)
Energy: ${energyLevel}
Explicitness: ${explicitnessLevel}
Humor: ${humorStyle}

## 🔴 CRITICAL: HER ACTUAL VOICE (STUDY THESE QUOTES)

These are VERBATIM quotes from ${modelName}'s interview. This is how she REALLY talks.
Your transformed scripts MUST sound like these quotes:

${sampleSpeechSection}

**VOICE TRANSFORMATION RULE**: If a line in your output doesn't sound like it could fit right next to these quotes, REWRITE IT.

Voice Pattern Analysis:
- ${voicePatterns}

### Voice Mechanics Checklist

Every script MUST include:
- At least 2-3 filler words (${fillerSimple}) placed naturally **MID-SENTENCE** (not at the very start!)
- Her energy level: ${energyLevel} - ${energyDescription}
- Her humor style: ${humorStyle}
- Her catchphrases where natural: ${catchphrases}

Filler word frequencies: ${fillerList}

## ⚠️ CRITICAL: OPENER DIVERSITY (READ THIS!)

**DO NOT START EVERY SCRIPT THE SAME WAY!**

The HOOK has an opener pattern that was CAREFULLY CHOSEN for diversity. 
**PRESERVE THE HOOK'S OPENER** - don't replace it with "Okay so like" every time!

❌ WRONG - Starting every script the same:
- "Okay so like, I want a man who..."
- "Okay so like, do you ever..."
- "Okay so like, my toxic trait is..."
- "So like, nothing is hotter than..."

✅ RIGHT - Varied openers that MATCH THE HOOK:
- "I want a man who..." (from bold_statement hook)
- "Do you ever..." (from question hook)  
- "My toxic trait is..." (from confession hook)
- "Nothing is fucking hotter than..." (from hot_take hook)
- "If you can't..." (from challenge hook)
- "When a guy..." (from relatable hook)

**RULES FOR OPENERS:**
1. If the hook starts with "I want/need/love a man" → START with that exact pattern
2. If the hook starts with "Do you ever" → START with that question
3. If the hook starts with "My toxic trait" → START with that confession
4. If the hook starts with "Nothing is hotter" → START with that phrase
5. Her fillers ("like", "um", "okay so") go AFTER the opener, not before

Example transformations:
- Hook: "I need a man who grabs my chin" → "I need a man who like grabs my chin and..."
- Hook: "Do you ever melt from a voice?" → "Do you ever like literally melt from just a guy's voice?"
- Hook: "My toxic trait is I'll pull your pants down" → "My toxic trait is that like, I'll be making fun of you and then I'm like pulling your pants down..."

**Her fillers enhance the MIDDLE of speech, they don't replace the opening hook pattern.**

### Parasocial Activation

Her strengths (USE THESE):
${strengthsSection}

Her avoid list (DO NOT USE):
${parasocialAvoid.map((a: string) => `- ${a.replace(/_/g, ' ')}`).join('\n') || '- None specified'}

## AI TELL DETECTION (REMOVE ALL OF THESE)

Common AI patterns that sound fake - NEVER use:

Opening crutches:
- "Look," / "Listen," as a cold opener
- "I mean," as a starter (mid-sentence is fine)
- "Honestly," / "Truthfully," to start
- "Let me tell you" / "Let me be real"
- "Here's the thing"

**CRITICAL - REPETITIVE OPENER PATTERN IS AN AI TELL:**
- If ALL scripts start with "Okay so like" = OBVIOUS AI TELL
- If ALL scripts start with "So like" = OBVIOUS AI TELL  
- Varied openers = HUMAN, Repetitive openers = AI
- The HOOK determines the opener, don't override it with filler words!

Mid-script tells:
- "right?" as a sentence ender (unless she does this naturally)
- "you know what I mean?" repeated (unless she does this)
- Perfect grammar in casual speech
- Overly balanced sentence structure
- "And honestly," / "But honestly,"
- Too many commas - her speech flows differently

Closing tells:
- "Just saying" / "That's all"
- "Period." / "Full stop."
- Neat wrap-ups that feel scripted
- Obvious callbacks that feel forced

Vocabulary tells:
- "boundaries" (overused AI word)
- "red flag" / "green flag" (overused unless she uses them)
- "vibe" / "energy" as nouns (overused)
- "literally" every other sentence (unless she does this)
- "lowkey" / "highkey" (unless she uses them)
- "valid" / "seen" / "heard" (therapy speak)

## TRANSFORMATION RULES

1. **PRESERVE THE HOOK'S OPENER (MOST IMPORTANT)**
   - The hook has a specific opener pattern - KEEP IT
   - "I need a man" stays "I need a man" (with her voice added AFTER)
   - "Do you ever" stays "Do you ever"
   - "My toxic trait" stays "My toxic trait"
   - Add her voice elements AFTER the hook pattern, not instead of it

2. READ HER SAMPLES ALOUD before rewriting
   - Get her rhythm in your head
   - Notice her sentence length patterns
   - Feel her energy

3. MATCH HER EXACT PATTERNS - MID-SENTENCE
   - If she uses "like" every 5-7 words, you should too
   - If she trails off with "um," do that (mid-sentence!)
   - If she interrupts herself, mirror that

4. PRESERVE THE CONTENT, TRANSFORM THE VOICE
   - Keep the hook, structure, and meaning intact
   - Change HOW it's said to match HER exactly

5. REMOVE POLISH
   - Her speech isn't polished - don't make it polished
   - Keep the beautiful mess of real speech
   - Real speech has tangents, self-corrections, trailing thoughts

6. **SINGLE FLOW OUTPUT (CRITICAL)**
   - Output must be ONE CONTINUOUS STRING
   - NO paragraph breaks (\n\n)
   - NO line breaks in the middle of speech
   - It should read like one natural spoken thought
   - This is how viral TikTok scripts work - one flow

7. REPLACE GENERIC VOCABULARY
   - If input has generic terms, replace with HER terms
   - "pussy" → her term | "dick" → her term | "orgasm" → her term
   - Her vocabulary makes it HERS, not generic content

8. TEST EACH LINE
   - Would she say this exact phrase?
   - Is this her vocabulary?
   - Is this her rhythm?
   - If ANY doubt, rewrite it

## SCRIPTS TO TRANSFORM

${scriptsSection}

## OUTPUT FORMAT

Return a JSON array of transformed scripts:

[
  {
    "script_index": 1,
    "original_hook": "The original hook text",
    "transformed_script": "The SINGLE CONTINUOUS FLOW script in her exact voice no line breaks just one thought that flows naturally like she's actually talking to camera you know like real speech not paragraphs okay?",
    "word_count": 52,
    "changes_made": [
      "Changed 'I mean honestly' to 'Like um'",
      "Replaced generic 'pussy' with her term 'kitty'",
      "Removed paragraph breaks - single flow now",
      "Added her signature phrase at closer"
    ],
    "vocabulary_replacements": [
      {"from": "generic_term", "to": "her_term"}
    ],
    "voice_fidelity_score": 92,
    "ai_tells_removed": ["honestly opener", "right? ender", "paragraph structure"],
    "voice_elements_added": ["like x4", "um x2", "her_euphemism:kitty x2", "catchphrase:example"]
  }
]

**CRITICAL**: 
- "transformed_script" must be ONE STRING with NO \\n characters
- Remove all line breaks from input if present
- This should read like continuous natural speech
- **TRANSFORMED_SCRIPT MUST START WITH THE SAME WORDS AS ORIGINAL_HOOK** (first 3-5 words)
- If original_hook is "I need a man who...", transformed_script MUST start with "I need a man who..."
- DO NOT add "Okay so like" or "So like" before the hook opener

Transform ALL ${scripts.length} scripts. Return ONLY the JSON array, no markdown, no explanation.`
}
