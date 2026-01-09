# Stage 3: Script Expansion Prompt
## Model: Claude Sonnet

You are expanding hooks into complete viral Instagram Reels scripts. Each script should be 10-18 seconds when spoken aloud (roughly 25-50 words).

## Model Profile
```json
{{voice_profile}}
```

## Hooks to Expand
{{hooks_to_expand}}

## Corpus Examples (Full Scripts by Archetype)
{{corpus_scripts}}

## Script Archetypes & Structures

### thirst_commentary (most common - 71%)
Structure: Observation → Reaction → Escalate desire → Playful close
Duration: 10-14 seconds
Example flow: "Nothing hotter than..." → describe → intensify → callback/CTA

### fantasy_desire (21%)
Structure: Hook → Build desire → Intensify → Soft CTA
Duration: 12-16 seconds
Example flow: "I want a man who..." → describe scenario → get specific → soft close

### confession (emotional depth)
Structure: Hook → Confession → Reaction → Normalize
Duration: 10-15 seconds
Example flow: "My toxic trait is..." → admit thing → own it → make relatable

### storytime (narrative)
Structure: Hook → Setup → Event → Punchline/Twist
Duration: 15-25 seconds
Example flow: "Okay so one time..." → set scene → what happened → reaction

### relatable_rant
Structure: Hook → Frustration → Escalate → Commiserate
Duration: 12-18 seconds
Example flow: "Why do guys always..." → the thing → get heated → "tell me I'm not crazy"

### advice_tip
Structure: Hook → Tip → Why it works → CTA
Duration: 12-18 seconds
Example flow: "The key to..." → what to do → why → "trust me on this"

## Fairy Tale Structure (Apply to Every Script)
```
Once upon a time → [setup, normal state]
Then → [tension, conflict, desire, confession]
Resolution → [payoff, punchline, callback]
(Optional) CTA → [follow, engage, link]
```

## Parasocial Requirements
- Every script MUST have at least 2 parasocial levers
- Prioritize: {{voice_profile.parasocial.strengths}}
- Avoid: {{voice_profile.parasocial.avoid}}

## CTA Variation (Don't use same CTA every script)
- **follow**: "follow me I miss you", "follow for more"
- **engagement**: "comment if you agree", "tell me I'm not crazy"
- **dm_bait**: "DM me your answer"
- **save_share**: "save this"
- **none**: No explicit CTA (use for 60-70% of scripts)

Use her actual CTA style: {{voice_profile.voice_mechanics.cta_style}}

## Duration Targets
- micro (8-12s): Quick hits, single jokes, hot takes
- short (12-18s): Most content - fantasies, tips, observations ← TARGET THIS
- medium (18-25s): Storytimes, detailed advice

## Output Format

For each hook, output the expanded script:

```json
{
  "scripts": [
    {
      "hook": "original hook text",
      "content": "full script including the hook",
      "hook_type": "from input",
      "script_archetype": "thirst_commentary|fantasy_desire|confession|storytime|relatable_rant|advice_tip|chain_game|roleplay|praise_dynamic",
      "parasocial_levers": ["lever1", "lever2"],
      "cta_type": "follow|engagement|dm_bait|save_share|none",
      "duration_estimate": 14,
      "word_count": 38,
      "emotional_arc": "playful_to_intense|vulnerable_to_confident|etc"
    }
  ]
}
```

## Quality Reminders
- Script should flow naturally when read aloud
- Hook is the first sentence(s) - don't repeat it
- Build tension/interest through the middle
- End with payoff or callback
- Keep her voice patterns throughout (not just in hook)

Expand all hooks into complete scripts now.
