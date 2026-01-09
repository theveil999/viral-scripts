/**
 * Profile Extraction Prompt Builder
 * Converts Google Meet transcripts into structured voice profiles
 */

const VALID_ARCHETYPES = [
  "girl_next_door",
  "bratty_princess",
  "gym_baddie",
  "alt_egirl",
  "classy_mysterious",
  "party_girl",
  "nerdy_gamer_girl",
  "spicy_latina",
  "southern_belle",
  "cool_girl",
  "chaotic_unhinged",
  "soft_sensual",
  "dominant",
] as const;

const VALID_PARASOCIAL_LEVERS = [
  "direct_address",
  "sexual_tension",
  "relatability",
  "vulnerability",
  "confession",
  "exclusivity",
  "challenge",
  "praise",
  "dominance",
  "playful_self_deprecation",
  "inside_reference",
  "aspiration",
  "pseudo_intimacy",
  "boyfriend_fantasy",
  "protector_dynamic",
] as const;

const VOICE_PROFILE_SCHEMA = `{
  "identity": {
    "name": "string | null - her real name if mentioned",
    "stage_name": "string - her creator/stage name",
    "nicknames_fans_use": ["array of nicknames fans call her"],
    "origin_location": "string | null - where she's from",
    "age_range": "string | null - 20s, 30s, etc.",
    "quick_bio": "string - 2-3 sentence summary capturing her essence"
  },

  "voice_mechanics": {
    "filler_words": [
      {"word": "like", "frequency": "high|medium|low"},
      {"word": "literally", "frequency": "high|medium|low"}
    ],
    "sentence_starters": ["okay so", "like", "honestly", "I mean", "so like"],
    "sentence_enders": ["or whatever", "I don't know", "but yeah", "so yeah"],
    "avg_sentence_length": "short|medium|long",
    "sentence_style": "fragmented|complete|run-on",
    "question_frequency": "high|medium|low",
    "self_interruption_patterns": ["wait no", "actually", "hold on", "—"],
    "swear_words": ["fuck", "shit", "damn", "etc"],
    "swear_frequency": "high|medium|low|none",
    "catchphrases": ["phrases she repeats", "her signature lines"],
    "cta_style": "string - how she typically asks for follows/engagement",
    "emphasis_style": {
      "uses_caps": "boolean",
      "stretches_words": "boolean - sooo, literallyyyy",
      "uses_repetition": "boolean - so, so good"
    },
    "text_style": {
      "lowercase_preference": "boolean",
      "emoji_usage": "heavy|moderate|minimal|none",
      "abbreviations": ["rn", "ngl", "tbh", "lol"],
      "grammar_strictness": "strict|relaxed|chaotic"
    }
  },

  "personality": {
    "self_described_traits": ["how she describes herself - verbatim if possible"],
    "friend_described_traits": ["how she says others describe her"],
    "humor_style": "roaster|hype_girl|both|absurdist|self_deprecating",
    "energy_level": "high|medium|low",
    "toxic_trait": "string | null - what she admits to",
    "hot_takes": ["strong opinions she expressed"],
    "conflict_style": "string | null - how she handles confrontation"
  },

  "content": {
    "niche_topics": ["dating", "relationships", "fitness", "lifestyle", "etc"],
    "can_talk_hours_about": ["topics she's passionate about"],
    "content_types": ["talking to camera", "storytime", "advice", "try-on", "GRWM"],
    "differentiator": "string - what makes her different from other creators",
    "strong_opinions_on": ["things she has takes about"],
    "trends_she_hates": ["things she pushes back on or refuses to do"],
    "brand_anchors": ["specific brands/things she's obsessed with - like Taco Bell"]
  },

  "audience": {
    "target_viewer_description": "string - who her ideal viewer is (SYNTHESIZE from context: if OnlyFans creator, default is 'Men 18-35 who purchase adult content'. Adjust based on her personality/niche)",
    "fantasy_fulfilled": "string - what fantasy she fulfills for viewers (SYNTHESIZE from her personality, flirting style, bedroom dynamic, and content type)",
    "how_fans_talk_to_her": "string | null - how fans interact (if she shares actual messages or fan behavior)",
    "best_performing_content": "string | null - what performs best (ONLY if she mentions it)"
  },

  "spicy": {
    "explicitness_level": "subtle|medium|full_send",
    "flirting_style": "string - how she flirts",
    "turn_ons_discussed": ["things she's mentioned turn her on"],
    "her_type": "string | null - what she's attracted to",
    "bedroom_dynamic": "string | null - dominant/submissive/switch if mentioned",
    "sexual_vocabulary": {
      "body_part_euphemisms": {
        "female_genitalia": ["her terms - e.g. 'kitty', 'cooch', 'cookie'"],
        "male_genitalia": ["her terms - e.g. 'it', 'him', 'his thing'"],
        "breasts": ["her terms - e.g. 'the girls', 'tits', 'boobs'"],
        "butt_anal": ["her terms - e.g. 'back door', 'booty', 'ass'"]
      },
      "act_euphemisms": {
        "oral_giving": ["her terms - e.g. 'going down', 'giving head', 'slurping'"],
        "oral_receiving": ["her terms - e.g. 'eating', 'munching', 'tasting'"],
        "intercourse": ["her terms - e.g. 'doing it', 'f*cking', 'hitting it'"],
        "orgasm": ["her terms - e.g. 'finishing', 'coming', 'getting off'"],
        "masturbation": ["her terms - e.g. 'playing with myself', 'DJ scratching'"],
        "ejaculation": ["her terms - e.g. 'finishing', 'releasing', 'filling me up'"]
      },
      "intensity_markers": ["how explicit she gets - words/phrases that show her comfort level"],
      "signature_spicy_phrases": ["her specific repeated spicy phrases/lines"]
    }
  },

  "boundaries": {
    "hard_nos": ["things she EXPLICITLY states she won't do - empty array if not mentioned"],
    "topics_to_avoid": ["topics she EXPLICITLY says to avoid - empty array if not mentioned"]
  },

  "aesthetic": {
    "visual_style": "string | null - how she presents visually",
    "colors_vibes": "string | null - her aesthetic vibe",
    "content_energy": "string | null - overall content energy"
  },

  "archetype_assignment": {
    "primary": "string - main archetype from valid list",
    "secondary": "string | null - secondary archetype if applicable",
    "mix": {
      "archetype_name": 0.6,
      "other_archetype": 0.4
    },
    "confidence": 0.85
  },

  "parasocial_config": {
    "strengths": ["levers she naturally uses well"],
    "avoid": ["levers that don't fit her"],
    "custom_levers": ["any unique connection tactics specific to her"]
  },

  "voice_transformation_rules": {
    "always_include": ["things every script should have"],
    "never_include": ["things to avoid in scripts"],
    "tone_calibration": {
      "baseline": "string - her default tone",
      "spicy_content": "string - tone for explicit content",
      "vulnerability": "string - tone for emotional content"
    }
  },

  "sample_speech": [
    "Verbatim quote 1 from transcript - preserve filler words, disfluencies, cursing",
    "Verbatim quote 2 - pick quotes that show her personality",
    "Verbatim quote 3 - variety of her speaking patterns",
    "Verbatim quote 4 - include her catchphrases if used",
    "Verbatim quote 5 - show her humor style"
  ]
}`;

export interface ExtractionConfig {
  modelName?: string | null;
  interviewerName?: string | null;
}

export function buildProfileExtractionPrompt(
  transcript: string,
  config?: ExtractionConfig
): string {
  const modelName = config?.modelName || "the creator";
  const interviewerName = config?.interviewerName || "The Veil Owners";

  return `You are extracting a complete voice profile from a creator interview transcript. This profile will be used to generate viral scripts that sound EXACTLY like her.

## SPEAKER IDENTIFICATION

**IMPORTANT:** This is an interview transcript with multiple speakers.
- **The interviewer is "${interviewerName}"** — IGNORE their speech entirely. Do not extract their voice patterns, quotes, or characteristics.
- **Extract the voice profile for: ${modelName}** — Focus ONLY on ${modelName}'s responses, speech patterns, and personality.
- If you see "${interviewerName}:" or similar, skip that section entirely.

## CRITICAL INSTRUCTIONS

1. **Extract ONLY ${modelName}'s speech** - Ignore interviewer questions and comments completely.
2. **Extract ONLY what's in the transcript** - Do not invent or assume. Use null for fields with no data.
3. **Preserve ${modelName}'s exact words** - sample_speech should be VERBATIM quotes from ${modelName} only, including filler words, disfluencies, and cursing.
4. **Be conservative with confidence** - Only assign high confidence (>0.8) when very clear.
5. **Voice mechanics are MOST IMPORTANT** - Pay close attention to HOW ${modelName} talks, not just WHAT she says.

---

## TRANSCRIPT QUALITY NOTES

Some transcripts have ECHO issues where the interviewer's lines contain repeated/echoed speech from the model. Focus ONLY on lines clearly attributed to ${modelName}.

If you see the same phrase in both speakers' lines, only attribute it to ${modelName}, not the interviewer.

Example of echo to ignore:
- ${modelName}: "I hate men"
- ${interviewerName}: "I hate men. Okay perfect." (interviewer echoing — ignore the echoed part)

---

## CRITICAL DISTINCTION: Synthesized vs Verbatim

**audience section fields**: SYNTHESIZED clean descriptions (no filler words, professional language)
**sample_speech**: VERBATIM quotes exactly as spoken (preserve filler words, capture authentic voice)

These are DIFFERENT requirements. Do not confuse them.

---

## AUDIENCE EXTRACTION RULES (CRITICAL FOR OF CREATORS)

For OnlyFans creators, audience data is ESSENTIAL for generating converting scripts. 
ALWAYS synthesize these fields - do NOT leave them null unless truly impossible.

- **target_viewer_description**: ALWAYS populate this field.
  - DEFAULT for OF creators: "Men 18-35 who purchase adult content on OnlyFans"
  - Adjust based on her personality, niche, archetype
  - If she mentions her followers are "in their 20s" or "older men" - use that
  - If she's a gamer girl, add "interested in gaming culture"
  - Example: "Men 22-30 who appreciate genuine, funny women with spicy personalities"

- **fantasy_fulfilled**: ALWAYS populate this field by synthesizing from:
  - Her archetype (girl_next_door = approachable fantasy, bratty_princess = "putting her in her place" fantasy)
  - Her personality (funny = friend fantasy, vulnerable = emotional connection fantasy)
  - Her bedroom dynamic (submissive = dominance fantasy, dominant = submission fantasy)
  - Her flirting style and turn-ons
  - Example: "The fun, genuine friend who's surprisingly spicy - girlfriend experience with no filter"

- **how_fans_talk_to_her**: Synthesize if she mentions fan behavior, otherwise use reasonable default:
  - If mentioned: Synthesize actual fan behavior
  - If not mentioned but she's OF creator: "Fans appreciate her genuine personality and spicy content"

- **best_performing_content**: Only if ${modelName} mentions specific content that performs well. Otherwise: null

IMPORTANT: For OF creators, target_viewer_description and fantasy_fulfilled should NEVER be null.
These fields drive the entire script generation direction. Synthesize from available data.

---

## SAMPLE_SPEECH EXTRACTION RULES

Extract 5-10 VERBATIM quotes that showcase ${modelName}'s unique voice.

Requirements:
- EXACT quotes as spoken, including filler words (um, like, you know)
- Preserve their authentic speech patterns and disfluencies
- Choose quotes that show personality, humor, or distinctive phrasing
- Include full sentences or thoughts, not fragments
- Only from ${modelName}, never from the interviewer

Good examples:
- "Oh my gosh, I don't know, it's so weird but like there's a streamer Katie B"
- "I feel like every time I call I'm like 'Oh my gosh guess what happened'"
- "I would never talk to a white boy again because of him"

These should capture how ${modelName} ACTUALLY talks — raw and authentic.

---

## BOUNDARIES EXTRACTION RULES

ONLY include boundaries ${modelName} EXPLICITLY states:
- hard_nos: Only things ${modelName} specifically says they won't do. Empty array [] if not discussed.
- topics_to_avoid: Only topics ${modelName} explicitly says to avoid. Empty array [] if not discussed.

Do NOT invent boundaries. Empty arrays are correct if ${modelName} doesn't mention any.

---

## ANTI-HALLUCINATION RULES

**Hallucinated data is WORSE than missing data. When in doubt, use null.**

- Do NOT invent audience demographics if ${modelName} doesn't discuss them
- Do NOT invent boundaries or hard limits
- Do NOT fabricate quotes for sample_speech
- If information isn't in the transcript, use null or empty array

---

## VOICE PROFILE SCHEMA

Output this exact JSON structure:

${VOICE_PROFILE_SCHEMA}

---

## VALID ARCHETYPES (choose from these only)

${VALID_ARCHETYPES.map((a) => `- ${a}`).join("\n")}

**Archetype Selection Guidelines:**
- girl_next_door: Approachable, relatable, sweet with naughty side
- bratty_princess: Demanding, playful, knows what she wants
- gym_baddie: Fitness-focused, confident, body-positive
- alt_egirl: Alternative aesthetic, edgy, mysterious
- classy_mysterious: Sophisticated, teasing, less explicit
- party_girl: High energy, fun, social, wild stories
- nerdy_gamer_girl: Gamer/nerd culture, relatable, playful
- spicy_latina: Passionate, fiery, expressive
- southern_belle: Sweet with edge, charming, country elements
- cool_girl: Into cars, sports, "one of the guys" vibe
- chaotic_unhinged: Unpredictable, wild, no filter
- soft_sensual: Slow, intimate, ASMR-adjacent
- dominant: In control, commanding, powerful

---

## VALID PARASOCIAL LEVERS (for parasocial_config)

${VALID_PARASOCIAL_LEVERS.map((l) => `- ${l}`).join("\n")}

**Lever Descriptions:**
- direct_address: Speaking directly to "you", making it personal
- sexual_tension: Suggestive, teasing, building desire
- relatability: Shared common experience ("Do you ever...")
- vulnerability: Sharing something personal, uncomfortable, real
- confession: Admitting something taboo or surprising
- exclusivity: Making viewer feel special, insider access
- challenge: Provocative, creating intrigue
- praise: Good boy/girl dynamics, affirmation
- dominance: Commanding energy, power dynamic
- playful_self_deprecation: Gentle self-mockery ("I need help")
- inside_reference: Callbacks to previous content
- aspiration: Glimpse of desirable lifestyle
- pseudo_intimacy: "Just between us" private feeling
- boyfriend_fantasy: Simulated romantic relationship
- protector_dynamic: "I'll take care of you" nurturing

---

## EXTRACTION GUIDELINES

### Voice Mechanics (CRITICAL)
Listen for and extract:
- Every filler word she uses and frequency (like, um, literally, honestly)
- How she starts sentences (So like, Okay so, I mean)
- How she ends sentences (or whatever, I don't know, but yeah)
- Her swearing vocabulary and how often
- Phrases she repeats (catchphrases)
- Self-interruption patterns (wait no, actually, hold on)
- Emphasis patterns (stretching words, repetition, caps)

### Sample Speech Selection
Pick 5-10 VERBATIM quotes from ${modelName} ONLY (never from the interviewer):
- Show ${modelName}'s natural speaking rhythm with all disfluencies
- Include ${modelName}'s filler words exactly as spoken
- Demonstrate ${modelName}'s personality and humor
- Vary in topic and emotion
- Include catchphrases if ${modelName} uses them
- These should be pure ${modelName} speech, not interview questions

### Sexual Vocabulary Extraction (CRITICAL FOR AUTHENTIC SCRIPTS)

Listen carefully for how ${modelName} talks about:
- Body parts: What euphemisms/terms does she use? (NOT what the interviewer uses)
- Sexual acts: Her specific language for describing intimate activities
- Intensity level: Does she censor herself? Use clinical terms? Go explicit?
- Signature phrases: Repeated spicy lines that are uniquely hers

Examples of what to capture:
- If she says "my kitty" or "down there" vs "my pussy" - note which
- If she says "going down on him" vs "sucking it" - note her preference
- Her comfort level signals what vocabulary scripts should use

IMPORTANT: Empty arrays are fine if she doesn't discuss these topics explicitly. Do NOT invent vocabulary.

### Archetype Assignment
Consider:
- How she describes herself
- Her energy level and explicitness comfort
- Her content niche and audience
- The fantasy she fulfills for viewers
- Assign mix percentages that sum to 1.0

### Boundaries (NON-NEGOTIABLE)
Carefully note:
- Any topics she explicitly says are off-limits
- Things she won't do or discuss
- Sensitive areas she mentions avoiding

---

## INTERVIEW TRANSCRIPT

\`\`\`
${transcript}
\`\`\`

---

## OUTPUT

Return ONLY valid JSON. No markdown code blocks, no explanations, no additional text.`;
}

export { VALID_ARCHETYPES, VALID_PARASOCIAL_LEVERS };
