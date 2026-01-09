# Stage 4: Voice Transformation Prompt
## Model: Claude Opus (Highest Quality Required)

**THIS IS THE MOST CRITICAL STAGE.** You are transforming scripts to sound EXACTLY like the model speaks. Voice fidelity is everything. If scripts sound AI-generated, they fail.

## Model Profile (Study This Carefully)
```json
{{voice_profile}}
```

## Sample Speech (How She ACTUALLY Talks)
These are verbatim quotes from her interview. Match this exact style:
{{voice_profile.sample_speech}}

## Scripts to Transform
{{scripts_to_transform}}

---

## VOICE TRANSFORMATION RULES

### 1. INJECT Her Specific Patterns

**Filler Words** (use at her natural frequency):
{{#each voice_profile.voice_mechanics.filler_words}}
- "{{this.word}}" - {{this.frequency}} frequency
{{/each}}

**Sentence Starters** (she begins sentences with these):
{{voice_profile.voice_mechanics.sentence_starters}}

**Self-Interruption Patterns** (how she catches herself):
{{voice_profile.voice_mechanics.self_interruption_patterns}}

**Catchphrases** (include at least 1 per 3 scripts):
{{voice_profile.voice_mechanics.catchphrases}}

**Swear Words** (match her exact vocabulary and frequency):
Words: {{voice_profile.voice_mechanics.swear_words}}
Frequency: {{voice_profile.voice_mechanics.swear_frequency}}

**Emphasis Style**:
- Uses caps: {{voice_profile.voice_mechanics.emphasis_style.uses_caps}}
- Stretches words: {{voice_profile.voice_mechanics.emphasis_style.stretches_words}} (e.g., "sooo", "literallyyyy")
- Uses repetition: {{voice_profile.voice_mechanics.emphasis_style.uses_repetition}} (e.g., "so, so good")

### 2. MATCH Her Rhythm

**Sentence Length**: {{voice_profile.voice_mechanics.avg_sentence_length}}
- short: Punchy. Fragments. Quick hits.
- medium: Natural flow. Some fragments, some complete.
- long: Run-on sentences. Thoughts that keep going. Connected with "and" and "like".

**Sentence Style**: {{voice_profile.voice_mechanics.sentence_style}}
- fragmented: Incomplete thoughts. Trails off. "You know?"
- complete: Full sentences but casual.
- run-on: Thoughts connected together like she's thinking out loud and one thing leads to another and...

**Question Frequency**: {{voice_profile.voice_mechanics.question_frequency}}
- high: Lots of rhetorical questions. "You know what I mean?" "Right?"
- medium: Occasional questions for engagement.
- low: More statements than questions.

### 3. MATCH Her Energy

**Energy Level**: {{voice_profile.personality.energy_level}}
- high: Exclamation marks. Excited language. "OH MY GOD". Quick pace.
- medium: Conversational. Natural enthusiasm.
- low: Calm. Deliberate. Fewer exclamations. Measured.

**Humor Style**: {{voice_profile.personality.humor_style}}
- roaster: Self-deprecating, teasing, sarcastic
- hype_girl: Supportive, encouraging, excited
- both: Mix of roasting and hyping

### 4. MATCH Her Explicitness

**Explicitness Level**: {{voice_profile.spicy.explicitness_level}}
- subtle: Suggestive but not explicit. Innuendo. "You know exactly what I mean."
- medium: Direct but not graphic. Names things but tastefully.
- full_send: No filter. Says exactly what she means. Graphic when appropriate.

---

## TRANSFORMATION PROCESS

For each script, do this:

1. **Read the original script**
2. **Read her sample speech** - internalize how she sounds
3. **Rewrite completely** in her voice:
   - Add her filler words at natural points
   - Use her sentence starters
   - Match her sentence length and style
   - Inject her catchphrases where they fit
   - Add her self-interruptions if she does them
   - Match her energy level
   - Match her explicitness level
   - Add her emphasis style (stretched words, repetition)

4. **Make it messy** - Real speech isn't perfect:
   - False starts ("I was gonna— actually no")
   - Backtracking ("wait, hold on")
   - Trailing off implied ("and like...")
   - Thoughts that restart

---

## ABSOLUTE BANS (Instant Failure)

NEVER use these AI-tell phrases:
- "Furthermore", "Additionally", "Moreover"
- "However" at start of sentence
- "Nevertheless", "Consequently", "Thus", "Hence"
- "It's important to note that"
- "One could argue that"
- "Interestingly enough"
- "That being said"
- "At the end of the day" (unless she actually says this casually)
- "In today's world"
- "Many people don't realize"
- "As someone who..."
- "I find it fascinating"
- "It's worth noting"

NEVER do these:
- Perfect grammar throughout (she doesn't speak perfectly)
- All sentences same length (vary it)
- Smooth transitions between every thought
- Balanced "on one hand... on the other hand"
- Complete thoughts every single time
- Formal vocabulary she wouldn't use

---

## BOUNDARY CHECK

Before outputting, verify script does NOT contain:
- Topics in her hard_nos: {{voice_profile.boundaries.hard_nos}}
- Topics she avoids: {{voice_profile.boundaries.topics_to_avoid}}

If a script violates boundaries, flag it for regeneration.

---

## Output Format

```json
{
  "transformed_scripts": [
    {
      "original_content": "the input script",
      "transformed_content": "the voice-matched script",
      "voice_elements_used": {
        "filler_words": ["like", "honestly"],
        "sentence_starters": ["okay so"],
        "catchphrases": ["follow me I miss you"],
        "swear_words": ["fuck"],
        "emphasis": ["sooo"]
      },
      "boundary_check": "passed|flagged",
      "notes": "any transformation notes"
    }
  ]
}
```

---

## Final Quality Check

Before outputting each script, verify:
- [ ] Could she read this OUT LOUD naturally without editing?
- [ ] Does it sound like HER sample speech?
- [ ] Are her filler words present at natural frequency?
- [ ] Is the energy level right?
- [ ] Is the explicitness level right?
- [ ] Zero AI-tell phrases?
- [ ] Feels like a first draft of natural speech (slightly messy, authentic)?

Transform all scripts now. Voice fidelity is everything.
