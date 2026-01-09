import type { VoiceProfile } from '../supabase/types'
import type { TransformedScript } from '../services/voice-transformation'

export interface ValidationParams {
  modelName: string
  voiceProfile: VoiceProfile
  scripts: TransformedScript[]
}

export function buildValidationPrompt(params: ValidationParams): string {
  const { modelName, voiceProfile, scripts } = params

  // Extract voice profile details
  const personality = voiceProfile.personality as Record<string, unknown>
  const energyLevel = personality?.energy_level || 'medium'
  const humorStyle = personality?.humor_style || 'mixed'

  const spicy = voiceProfile.spicy as Record<string, unknown>
  const explicitnessLevel = spicy?.explicitness_level || 'medium'

  // Extract HER sexual vocabulary for validation
  const sexualVocab = spicy?.sexual_vocabulary as Record<string, unknown> | undefined
  const bodyEuphemisms = sexualVocab?.body_part_euphemisms as Record<string, string[]> | undefined
  const signatureSpicyPhrases = (sexualVocab?.signature_spicy_phrases as string[]) || []
  
  // Build vocabulary reference for checking
  const herTermsList = [
    ...(bodyEuphemisms?.female_genitalia || []),
    ...(bodyEuphemisms?.male_genitalia || []),
    ...(bodyEuphemisms?.breasts || []),
    ...(bodyEuphemisms?.butt_anal || []),
  ].filter(Boolean)

  // Voice mechanics
  const voiceMechanics = voiceProfile.voice_mechanics as Record<string, unknown>
  const fillerWords = (voiceMechanics?.filler_words as Array<{ word: string; frequency: string }>) || []
  const fillerList = fillerWords.map((f) => `"${f.word}" (${f.frequency})`).join(', ') || 'natural fillers'

  const catchphrases = (voiceMechanics?.catchphrases as string[])?.join(', ') || 'none identified'

  // Sample speech
  const sampleSpeech = voiceProfile.sample_speech || []
  const sampleSpeechSection = sampleSpeech
    .slice(0, 5)
    .map((quote, i) => `${i + 1}. "${quote}"`)
    .join('\n')

  // Boundaries
  const boundaries = voiceProfile.boundaries as Record<string, unknown>
  const hardNos = (boundaries?.hard_nos as string[]) || []
  const topicsToAvoid = (boundaries?.topics_to_avoid as string[]) || []

  const hardNosSection = hardNos.length > 0
    ? hardNos.map((n) => `- "${n}"`).join('\n')
    : '- None specified'

  const topicsSection = topicsToAvoid.length > 0
    ? topicsToAvoid.map((t) => `- "${t}"`).join('\n')
    : '- None specified'

  // CRITICAL: Audience targeting data
  const audience = voiceProfile.audience as Record<string, unknown>
  const targetViewer = (audience?.target_viewer_description as string) || 'Male viewers 18-35'
  const fantasyFulfilled = (audience?.fantasy_fulfilled as string) || 'Girlfriend experience / direct attention'

  // Parasocial config - levers to avoid
  const parasocialAvoid = voiceProfile.parasocial_config?.avoid || voiceProfile.parasocial?.avoid || []
  const parasocialAvoidSection = parasocialAvoid.length > 0
    ? parasocialAvoid.map((lever: string) => `- ${lever.replace(/_/g, ' ')}`).join('\n')
    : '- None specified'

  // Scripts section
  const scriptsSection = scripts
    .map((script, i) => {
      return `---
Script ${i + 1}:
"${script.transformed_script}"
---`
    })
    .join('\n\n')

  return `You are a script quality validator. Score each script for voice fidelity, audience targeting, and flag issues.

## ⚠️ CRITICAL: TARGET AUDIENCE CHECK

WHO IS WATCHING: ${targetViewer}
THE FANTASY SHE FULFILLS: ${fantasyFulfilled}

**AUTOMATIC FAIL CONDITIONS (Audience Mismatch)**:
- Script sounds like relationship advice FOR women = FAIL
- Script sounds like girlfriends talking to each other = FAIL
- Script doesn't address/appeal to male viewers = FAIL
- Script lacks parasocial connection (no direct address, no intimacy) = FAIL

**PASS requires**: Script makes male viewer feel like ${modelName} is speaking TO him personally.

## ${modelName}'s Voice Reference

Sample speech (this is how she ACTUALLY talks):
${sampleSpeechSection}

Key markers:
- Filler words: ${fillerList}
- Catchphrases: ${catchphrases}
- Energy: ${energyLevel}
- Humor style: ${humorStyle}
- Explicitness: ${explicitnessLevel}

Parasocial Levers to AVOID (using these = -10 points):
${parasocialAvoidSection}

Boundaries (MUST NOT contain):
Hard nos:
${hardNosSection}

Topics to avoid:
${topicsSection}

## SCORING CRITERIA

Voice Fidelity (0-100):
- 90-100: Sounds exactly like her, indistinguishable from real, uses HER vocabulary
- 80-89: Very close, uses her voice patterns, minor improvements possible
- 70-79: Good but has some generic patterns or wrong vocabulary
- 60-69: Needs work, doesn't quite capture her voice
- Below 60: Fail, rewrite needed

Vocabulary Check (each issue = -5 points):
- Uses generic euphemisms instead of HER terms (e.g., "pink taco" when she says "kitty")
- Uses vocabulary from OTHER creators, not hers
- Clinical/formal terms when she uses casual slang
- Her known terms: ${herTermsList.length > 0 ? herTermsList.join(', ') : 'check sample speech'}
- Her signature phrases: ${signatureSpicyPhrases.length > 0 ? signatureSpicyPhrases.join(', ') : 'check sample speech'}

Specificity Check (each issue = -5 points):
- Generic statements instead of specific imagery
- BAD: "when he does something hot" → GOOD: "when he grabs my chin"
- BAD: "it feels good" → GOOD: "my whole body just like shuts down"
- Viral scripts are SPECIFIC, not vague

Structure Check (each issue = -10 points):
- Has paragraph breaks (\\n\\n) = FAIL for structure
- Multiple line breaks = should be ONE continuous flow
- Too long (>90 words for long scripts) = trim needed

Audience Targeting Check (each issue = -10 points):
- Script reads like advice for women (not content for male viewers)
- Lacks direct address / "you" targeting
- Missing parasocial engagement elements
- Content doesn't trigger "she's talking to ME" feeling

AI Tell Detection:
Check for these patterns (each found = -5 points):
- "I mean," / "Honestly," / "Look," as openers
- "right?" / "you know what I mean?" as enders (unless in her samples)
- Overly balanced sentence structure
- Perfect grammar in casual speech
- Generic filler placement
- "boundaries" / "red flag" / "vibe" overuse
- "Just saying" / "Period." as closers
- Too-neat wrap-ups

Boundary Check:
- Any hard_nos mentioned = FAIL
- Any topics_to_avoid referenced = FAIL

## SCRIPTS TO VALIDATE

${scriptsSection}

## OUTPUT FORMAT

Return a JSON array:

[
  {
    "script_index": 1,
    "voice_fidelity_score": 87,
    "audience_targeting_score": 90,
    "vocabulary_score": 85,
    "specificity_score": 80,
    "ai_tells_found": ["right? ender in sentence 3"],
    "vocabulary_issues": ["used 'pussy' instead of her term 'kitty'"],
    "specificity_issues": ["'when he's hot' too generic - needs specific action"],
    "structure_issues": ["has paragraph break - should be single flow"],
    "audience_issues": [],
    "boundary_violations": [],
    "parasocial_avoid_violations": [],
    "strengths": ["Good use of filler 'like'", "Catchphrase used naturally", "Strong direct address", "Specific imagery in hook"],
    "improvements": ["Replace generic terms with her vocabulary", "Remove line breaks", "Add more specific detail"],
    "verdict": "PASS",
    "revision_priority": "low"
  }
]

Verdicts:
- "PASS": Voice score >= 80, audience score >= 80, vocab score >= 75, no boundary violations, single flow structure
- "REVISE": Any score 60-79, or has fixable issues (wrong vocab, line breaks)
- "FAIL": Any score < 60, boundary violations, sounds like advice for women, or wrong voice entirely

revision_priority: "none" | "low" | "medium" | "high"

Validate ALL ${scripts.length} scripts. Return ONLY the JSON array, no markdown, no explanation.`
}
