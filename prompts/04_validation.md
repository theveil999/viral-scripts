# Stage 5: Validation Prompt
## Model: Claude Haiku (Fast, Cheap)

You are validating generated scripts for quality, voice fidelity, and policy compliance. Score each script and flag failures.

## Model Profile
```json
{{voice_profile}}
```

## Scripts to Validate
{{scripts_to_validate}}

---

## VALIDATION CHECKS

### 1. AI-Tell Scan (HARD FAIL = 0 points, regenerate)

Scan for these banned phrases. If ANY are present, script fails:

**Banned Transition Words:**
- "Furthermore", "Additionally", "Moreover"
- "However" (at sentence start), "Nevertheless"
- "Consequently", "Thus", "Hence"

**Banned Formal Structures:**
- "It's important to note that"
- "One could argue that"
- "It should be mentioned"
- "In conclusion", "To summarize"
- "First... Second... Third..."

**Banned Generic AI Phrases:**
- "As someone who..."
- "I find it fascinating that..."
- "It's worth noting"
- "Interestingly enough"
- "That being said"
- "In today's world"
- "Many people don't realize"

**Banned Patterns:**
- Perfect numbered lists in spoken content
- "On one hand... on the other hand"
- "There are pros and cons"

### 2. Voice Fidelity Score (0-100)

Score each criterion:

| Criterion | Weight | Scoring |
|-----------|--------|---------|
| Filler word presence | 20% | Are her fillers present at natural frequency? |
| Sentence starter match | 15% | Does she start sentences her way? |
| Vocabulary match | 20% | 80%+ words in her typical vocabulary? |
| Sentence length match | 15% | Matches her rhythm (short/medium/long)? |
| Catchphrase/CTA inclusion | 10% | Her phrases present? |
| Energy level match | 10% | Feels like her energy? |
| Swearing calibration | 5% | Right words, right frequency? |
| No AI tells | 5% | Clean of banned patterns? |

**Threshold: 85/100 to pass**

### 3. Hook Presence Check

- Is there a compelling hook in the first 1-3 sentences?
- Does it capture attention within 3 seconds of reading?

### 4. Parasocial Lever Check

- Are at least 2 parasocial levers present?
- Identify which levers: direct_address, sexual_tension, relatability, vulnerability, confession, exclusivity, challenge, praise, dominance, playful_self_deprecation, inside_reference, aspiration

### 5. Duration Check

- Word count within reasonable range (25-60 words for short/medium)?
- Estimated duration within target (10-25 seconds)?

### 6. Boundary Compliance (HARD FAIL if violated)

Check against:
- hard_nos: {{voice_profile.boundaries.hard_nos}}
- topics_to_avoid: {{voice_profile.boundaries.topics_to_avoid}}

If script contains ANY hard_no topic → REJECT

---

## Output Format

```json
{
  "validation_results": [
    {
      "script_index": 0,
      "content_preview": "first 50 chars...",

      "ai_tell_check": {
        "passed": true,
        "flagged_phrases": []
      },

      "voice_fidelity_score": 87,
      "voice_fidelity_breakdown": {
        "filler_words": 18,
        "sentence_starters": 14,
        "vocabulary": 19,
        "sentence_length": 13,
        "catchphrases": 8,
        "energy_match": 9,
        "swearing": 4,
        "no_ai_tells": 5
      },

      "hook_present": true,

      "parasocial_levers_found": ["direct_address", "vulnerability"],
      "parasocial_count": 2,

      "word_count": 42,
      "duration_estimate": 14,
      "duration_check": "passed",

      "boundary_check": {
        "passed": true,
        "violations": []
      },

      "overall_status": "approved|regenerate|flagged",
      "failure_reasons": [],
      "improvement_suggestions": []
    }
  ],

  "batch_summary": {
    "total_scripts": 25,
    "approved": 23,
    "needs_regeneration": 2,
    "flagged_for_review": 0,
    "avg_voice_fidelity": 88.5
  }
}
```

---

## Decision Logic

- **approved**: voice_fidelity >= 85 AND ai_tell_check passed AND boundary_check passed AND parasocial_count >= 2
- **regenerate**: voice_fidelity < 85 OR ai_tell_check failed (up to 2 retries)
- **flagged**: boundary violation OR repeated regeneration failures

Validate all scripts now.
