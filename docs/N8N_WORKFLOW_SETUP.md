# n8n Workflow Setup Guide
## Script Generation Pipeline

This document describes the n8n workflow structure for the Viral Script Generation System.

---

## Webhook Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /webhook/generate-scripts` | Trigger batch script generation |
| `POST /webhook/extract-profile` | Extract voice profile from transcript |

Base URL: `https://theveilagency.app.n8n.cloud/webhook`

---

## Workflow 1: Script Generation Pipeline

### Trigger
**Webhook Node**
- Method: POST
- Path: `/generate-scripts`
- Authentication: Header Auth (optional)

**Expected Payload:**
```json
{
  "model_id": "uuid",
  "script_count": 25,
  "preferences": {
    "hook_types": ["bold_statement", "confession"],
    "duration_target": "short",
    "exclude_recent_hooks": true
  }
}
```

---

### Stage 1: Fetch Model + Corpus

**Node: Supabase - Get Model**
```sql
SELECT
  id, name, voice_profile, archetype_tags,
  niche_tags, boundaries, explicitness_level, embedding
FROM models
WHERE id = '{{$json.model_id}}'
```

**Node: Supabase - Vector Search Corpus** (parallel)
```sql
SELECT
  id, content, hook, hook_type, script_archetype,
  parasocial_levers, quality_score
FROM corpus
WHERE is_active = true
  AND quality_score >= 0.6
ORDER BY embedding <=> '{{$json.model_embedding}}'::vector
LIMIT 15
```

**Node: Supabase - Get Fresh Hooks** (parallel)
```sql
SELECT content, hook_type, freshness_score
FROM hooks
WHERE (model_id = '{{$json.model_id}}' OR model_id IS NULL)
  AND freshness_score > 0.3
ORDER BY freshness_score DESC, avg_performance_score DESC
LIMIT 20
```

**Node: Merge Results**
- Combine model profile, corpus examples, and hook bank

---

### Stage 2: Hook Generation

**Node: Claude API (Sonnet)**
- Model: `claude-sonnet-4-20250514`
- Temperature: 0.9 (creative)
- Max tokens: 4000

**System Prompt:** Load from `prompts/01_hook_generation.md`

**Variables to inject:**
- `{{voice_profile}}` → model.voice_profile
- `{{archetype_tags}}` → model.archetype_tags
- `{{corpus_hooks}}` → corpus examples
- `{{hook_count}}` → script_count + 10 (generate extras)

**Output:** JSON array of hooks with metadata

---

### Stage 3: Script Expansion

**Node: Claude API (Sonnet)**
- Model: `claude-sonnet-4-20250514`
- Temperature: 0.8
- Max tokens: 8000

**System Prompt:** Load from `prompts/02_script_expansion.md`

**Variables to inject:**
- `{{voice_profile}}` → model.voice_profile
- `{{hooks_to_expand}}` → top hooks from Stage 2 (select script_count)
- `{{corpus_scripts}}` → full corpus examples

**Output:** JSON array of expanded scripts

---

### Stage 4: Voice Transformation

**Node: Claude API (Opus)**
- Model: `claude-opus-4-20250514`
- Temperature: 0.7 (balanced)
- Max tokens: 10000

**System Prompt:** Load from `prompts/03_voice_transformation.md`

**Variables to inject:**
- `{{voice_profile}}` → complete model.voice_profile
- `{{scripts_to_transform}}` → scripts from Stage 3

**Output:** JSON array of voice-matched scripts

---

### Stage 5: Validation

**Node: Claude API (Haiku)**
- Model: `claude-haiku-4-20250514`
- Temperature: 0.3 (consistent)
- Max tokens: 6000

**System Prompt:** Load from `prompts/04_validation.md`

**Variables to inject:**
- `{{voice_profile}}` → model.voice_profile
- `{{scripts_to_validate}}` → scripts from Stage 4

**Output:** Validation results with scores and statuses

---

### Stage 5b: Regeneration Loop (Conditional)

**Node: IF - Check Failures**
- Condition: `validation_results.needs_regeneration > 0`

**Node: Filter Failed Scripts**
- Extract scripts with status "regenerate"

**Node: Loop Back to Stage 4**
- Send failed scripts back through Voice Transformation
- Max 2 retries per script

---

### Stage 6: Save to Database

**Node: Supabase - Insert Scripts**
```sql
INSERT INTO scripts (
  model_id, content, hook, hook_type, script_archetype,
  parasocial_levers, duration_estimate, word_count,
  voice_fidelity_score, validation_passed, status
) VALUES (
  '{{model_id}}',
  '{{content}}',
  '{{hook}}',
  '{{hook_type}}',
  '{{script_archetype}}',
  '{{parasocial_levers}}',
  {{duration_estimate}},
  {{word_count}},
  {{voice_fidelity_score}},
  true,
  'draft'
)
RETURNING id, content, hook_type, script_archetype
```

**Node: Supabase - Update Hook Usage** (for hooks that were used)
```sql
UPDATE hooks
SET
  times_used = times_used + 1,
  last_used_at = NOW(),
  freshness_score = freshness_score * 0.9
WHERE content = ANY('{{used_hooks}}')
```

**Node: Respond to Webhook**
```json
{
  "success": true,
  "model_id": "{{model_id}}",
  "scripts_generated": {{count}},
  "scripts": [{{script_summaries}}]
}
```

---

## Workflow 2: Profile Extraction Pipeline

### Trigger
**Webhook Node**
- Method: POST
- Path: `/extract-profile`

**Expected Payload:**
```json
{
  "name": "Model Name",
  "stage_name": "Stage Name",
  "transcript": "full transcript text..."
}
```

---

### Stage 1: Extract Profile

**Node: Claude API (Sonnet)**
- Model: `claude-sonnet-4-20250514`
- Temperature: 0.5 (accurate extraction)
- Max tokens: 8000

**System Prompt:** Load from `prompts/00_profile_extraction.md`

**Variables:**
- `{{transcript}}` → input transcript

**Output:** Complete voice_profile JSON

---

### Stage 2: Generate Embedding

**Node: OpenAI Embeddings** (or Voyage AI)
- Model: `text-embedding-3-small`
- Input: Concatenated profile summary for semantic matching

---

### Stage 3: Save to Database

**Node: Supabase - Insert Model**
```sql
INSERT INTO models (
  name, stage_name, transcript_raw, voice_profile,
  archetype_tags, niche_tags, boundaries,
  explicitness_level, embedding
) VALUES (
  '{{name}}',
  '{{stage_name}}',
  '{{transcript}}',
  '{{voice_profile}}',
  '{{archetype_tags}}',
  '{{niche_tags}}',
  '{{boundaries}}',
  '{{explicitness_level}}',
  '{{embedding}}'
)
RETURNING id, name, stage_name, archetype_tags
```

**Node: Respond to Webhook**
```json
{
  "success": true,
  "model_id": "{{id}}",
  "name": "{{name}}",
  "archetype_tags": ["{{archetype_tags}}"]
}
```

---

## Environment Variables (n8n)

Set these in n8n credentials:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | https://cnqaomffusspvhugrwpf.supabase.co |
| `SUPABASE_SERVICE_KEY` | Service role key (not anon) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | For embeddings (optional) |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Total pipeline time | < 90 seconds for 25 scripts |
| Stage 2 (Hooks) | ~10 seconds |
| Stage 3 (Expansion) | ~20 seconds |
| Stage 4 (Voice) | ~40 seconds |
| Stage 5 (Validation) | ~10 seconds |
| Stage 6 (Save) | ~5 seconds |

---

## Error Handling

1. **API Rate Limits**: Add retry logic with exponential backoff
2. **Validation Failures**: Max 2 regeneration attempts per script
3. **Database Errors**: Log and return partial success
4. **Timeout**: Set 120s timeout on webhook, stream partial results if needed

---

## Testing

1. Create test model with minimal voice_profile
2. Seed corpus with 10-15 quality examples
3. Trigger pipeline with script_count: 5
4. Verify scripts in database
5. Check voice fidelity scores
