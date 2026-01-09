# Profile Extraction Prompt
## Model: Claude Sonnet

You are extracting a complete voice profile from an interview transcript with an OnlyFans model. This profile will be used to generate scripts that sound exactly like her.

## Interview Transcript
```
{{transcript}}
```

---

## EXTRACTION TASK

Analyze the transcript and extract the complete voice profile. Pay special attention to:

1. **HOW she talks** (voice mechanics) - This is the most important part
2. **WHO she is** (personality, content, audience)
3. **WHAT she avoids** (boundaries)

---

## Voice Profile Schema

Extract and output this exact JSON structure:

```json
{
  "identity": {
    "name": "her real name if mentioned",
    "stage_name": "her creator/stage name",
    "nicknames_fans_use": ["what fans call her"],
    "origin_location": "where she's from if mentioned",
    "age_range": "20s, 30s, etc.",
    "quick_bio": "1-2 sentence summary of who she is"
  },

  "voice_mechanics": {
    "filler_words": [
      {"word": "like", "frequency": "high|medium|low"},
      {"word": "literally", "frequency": "high|medium|low"}
    ],
    "sentence_starters": ["okay so", "like", "honestly", "I mean"],
    "avg_sentence_length": "short|medium|long",
    "sentence_style": "fragmented|complete|run-on",
    "question_frequency": "high|medium|low",
    "self_interruption_patterns": ["wait no", "actually", "hold on"],
    "swear_words": ["fuck", "shit"],
    "swear_frequency": "high|medium|low|none",
    "catchphrases": ["phrases she repeats", "her CTAs"],
    "cta_style": "her typical call to action phrasing",
    "emphasis_style": {
      "uses_caps": false,
      "stretches_words": true,
      "uses_repetition": true
    },
    "text_style": {
      "lowercase_preference": true,
      "emoji_usage": "heavy|moderate|minimal|none",
      "abbreviations": ["rn", "ngl", "tbh"]
    }
  },

  "personality": {
    "self_described_traits": ["how she describes herself"],
    "friend_described_traits": ["how others describe her"],
    "humor_style": "roaster|hype_girl|both",
    "energy_level": "high|medium|low",
    "toxic_trait": "what she admits to",
    "hot_takes": ["strong opinions she expressed"]
  },

  "content": {
    "niche_topics": ["dating", "relationships", "fitness", etc.],
    "can_talk_hours_about": ["topics she's passionate about"],
    "content_types": ["talking to camera", "storytime", "advice", etc.],
    "differentiator": "what makes her different from other creators",
    "strong_opinions_on": ["things she has takes about"],
    "trends_she_hates": ["things she pushes back on"]
  },

  "audience": {
    "target_viewer_description": "who her ideal viewer is",
    "fantasy_fulfilled": "what fantasy she fulfills for viewers",
    "how_fans_talk_to_her": "how fans typically interact/DM her",
    "best_performing_content": "what does well if mentioned"
  },

  "spicy": {
    "explicitness_level": "subtle|medium|full_send",
    "flirting_style": "how she flirts",
    "turn_ons_discussed": ["things she's mentioned turn her on"],
    "her_type": "what she's attracted to"
  },

  "boundaries": {
    "hard_nos": ["things she absolutely won't do/discuss"],
    "topics_to_avoid": ["sensitive topics to steer clear of"]
  },

  "aesthetic": {
    "visual_style": "how she presents visually",
    "colors_vibes": "her aesthetic vibe",
    "content_energy": "overall content energy"
  },

  "parasocial": {
    "strengths": ["levers she naturally uses well"],
    "avoid": ["levers that don't fit her"]
  },

  "archetype_assignment": {
    "primary": "main archetype",
    "secondary": "secondary archetype if applicable",
    "confidence": 0.85
  },

  "sample_speech": [
    "Verbatim quote 1 from transcript showing her natural voice",
    "Verbatim quote 2 - pick ones that show her personality",
    "Verbatim quote 3 - variety of her speaking patterns"
  ]
}
```

---

## Archetype Options (choose primary and optional secondary)

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
- submissive: Wanting to please, responsive

---

## Parasocial Lever Options (for strengths/avoid)

- direct_address: Speaking to "you"
- sexual_tension: Suggestive, teasing
- relatability: Shared experience
- vulnerability: Personal, real
- confession: Admitting something
- exclusivity: Making viewer feel special
- challenge: Provocative
- praise: Good boy/girl dynamics
- dominance: Commanding
- playful_self_deprecation: Self-mockery
- inside_reference: Callbacks
- aspiration: Lifestyle glimpses

---

## Extraction Guidelines

1. **Voice Mechanics are CRITICAL** - Listen for:
   - Every filler word she uses and how often
   - How she starts sentences
   - Whether she speaks in fragments, complete sentences, or run-ons
   - Her swearing vocabulary and frequency
   - Phrases she repeats (catchphrases)
   - How she emphasizes things

2. **Sample Speech Selection** - Pick 3-5 verbatim quotes that:
   - Show her natural speaking rhythm
   - Include her filler words
   - Demonstrate her personality
   - Vary in topic/emotion

3. **Archetype Assignment** - Consider:
   - How she describes herself
   - Her energy and explicitness
   - Her content niche
   - The fantasy she fulfills

4. **Boundaries are Non-Negotiable** - Carefully note:
   - Any topics she says are off-limits
   - Things she explicitly won't do
   - Sensitive areas mentioned

Output the complete voice profile JSON now.
