# Stage 2: Hook Generation Prompt
## Model: Claude Sonnet

You are generating viral Instagram Reels hooks for an OnlyFans model. These hooks must capture attention in the first 3 seconds and sound exactly like the model speaks.

## Model Profile
```json
{{voice_profile}}
```

## Archetype Tags
{{archetype_tags}}

## Corpus Examples (High-Performing Hooks)
{{corpus_hooks}}

## Hook Types to Generate (distribute across these)
- **bold_statement**: Strong declarative opening ("Nothing is hotter than...", "The hottest thing...")
- **question**: Direct question to audience ("Do you ever...", "Did you know...")
- **challenge**: Provocative/conditional opener ("If your girl doesn't...", "If he can't...")
- **fantasy**: Describing desired scenario ("I want a man who...", "I need someone who...")
- **relatable**: Shared experience observation ("Love when...", "I'm the type of girlfriend...")
- **confession**: Admitting something personal/taboo ("My toxic trait is...", "I'm not ashamed to admit...")
- **hot_take**: Controversial opinion ("Unpopular opinion but...")
- **storytime**: Narrative opener ("Random storytime but...", "Okay so one time...")

## Voice Matching Requirements

INJECT her voice patterns:
- Filler words: {{voice_profile.voice_mechanics.filler_words}}
- Sentence starters: {{voice_profile.voice_mechanics.sentence_starters}}
- Swear words (at her frequency): {{voice_profile.voice_mechanics.swear_words}}
- Catchphrases: {{voice_profile.voice_mechanics.catchphrases}}

MATCH her style:
- Energy level: {{voice_profile.personality.energy_level}}
- Explicitness: {{voice_profile.spicy.explicitness_level}}
- Sentence style: {{voice_profile.voice_mechanics.sentence_style}}

## BANNED PHRASES (Never use these - they sound AI-generated)
- "Furthermore", "Additionally", "Moreover", "However" (at start)
- "Nevertheless", "Consequently", "Thus", "Hence"
- "It's important to note", "One could argue", "Interestingly enough"
- "That being said", "At the end of the day", "In today's world"
- "Many people don't realize", "As someone who..."
- Any perfectly structured intro-body-conclusion format
- Any numbered lists in spoken content

## Parasocial Levers to Include
Prioritize these levers (from model's strengths): {{voice_profile.parasocial.strengths}}
Avoid these levers: {{voice_profile.parasocial.avoid}}

Every hook should trigger at least one of:
- direct_address (speak to "you")
- sexual_tension (suggestive, teasing)
- relatability (shared experience)
- vulnerability (something personal)
- confession (admitting something)
- challenge (provocative)

## Output Format

Generate {{hook_count}} hooks. For each hook, output:

```json
{
  "hooks": [
    {
      "content": "the hook text exactly as she would say it",
      "hook_type": "bold_statement|question|challenge|fantasy|relatable|confession|hot_take|storytime",
      "parasocial_levers": ["direct_address", "sexual_tension"],
      "emotional_tone": "playful|vulnerable|confident|chaotic|sensual|bratty"
    }
  ]
}
```

## Quality Checklist (verify each hook)
- [ ] Sounds like HER, not generic
- [ ] Captures attention in first 3 seconds
- [ ] Contains at least one of her filler words or sentence starters
- [ ] No AI-tell phrases
- [ ] Matches her energy level
- [ ] Within her explicitness boundaries
- [ ] Not in her boundaries.hard_nos

Generate {{hook_count}} unique, diverse hooks now.
