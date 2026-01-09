-- Hybrid corpus search: filters + vector similarity + quality boost
-- Supports filtering by archetype, parasocial levers, and hook type

CREATE OR REPLACE FUNCTION match_corpus_hybrid(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  min_similarity float DEFAULT 0.3,
  archetype_filter text[] DEFAULT NULL,
  lever_filter text[] DEFAULT NULL,
  hook_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  hook text,
  hook_type text,
  script_archetype text,
  parasocial_levers text[],
  quality_score float,
  creator text,
  similarity_score float,
  match_reasons text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id,
      c.content,
      c.hook,
      c.hook_type,
      c.script_archetype,
      c.parasocial_levers,
      c.quality_score,
      c.creator,
      -- Base similarity from vector distance (cosine similarity)
      1 - (c.embedding <=> query_embedding) AS base_similarity,
      -- Track match reasons for debugging/transparency
      ARRAY_REMOVE(ARRAY[
        CASE WHEN archetype_filter IS NOT NULL
             AND c.script_archetype = ANY(archetype_filter)
             THEN 'archetype_match' END,
        CASE WHEN lever_filter IS NOT NULL
             AND c.parasocial_levers && lever_filter
             THEN 'lever_match' END,
        CASE WHEN c.quality_score >= 0.8 THEN 'high_quality' END
      ], NULL) AS reasons
    FROM corpus c
    WHERE
      c.embedding IS NOT NULL
      AND c.is_active = true
      -- Optional archetype filter (if provided, must match)
      AND (archetype_filter IS NULL OR c.script_archetype = ANY(archetype_filter))
      -- Optional lever filter (if provided, must have at least one overlap)
      AND (lever_filter IS NULL OR c.parasocial_levers && lever_filter)
      -- Optional hook type filter
      AND (hook_type_filter IS NULL OR c.hook_type = hook_type_filter)
  )
  SELECT
    s.id,
    s.content,
    s.hook,
    s.hook_type,
    s.script_archetype,
    s.parasocial_levers,
    s.quality_score,
    s.creator,
    -- Final score: base similarity + quality boost (max 0.1 boost)
    LEAST(1.0, s.base_similarity + (COALESCE(s.quality_score, 0.5) * 0.1)) AS similarity_score,
    s.reasons AS match_reasons
  FROM scored s
  WHERE s.base_similarity >= min_similarity
  ORDER BY
    -- Primary: similarity score with quality boost
    s.base_similarity + (COALESCE(s.quality_score, 0.5) * 0.1) DESC
  LIMIT match_count;
END;
$$;

-- Diversified search: ensures variety in hook types
-- Returns top N per hook type, then ranks by similarity
CREATE OR REPLACE FUNCTION match_corpus_diversified(
  query_embedding vector(1536),
  total_count int DEFAULT 10,
  per_hook_type int DEFAULT 3,
  min_similarity float DEFAULT 0.3,
  archetype_filter text[] DEFAULT NULL,
  lever_filter text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  hook text,
  hook_type text,
  script_archetype text,
  parasocial_levers text[],
  quality_score float,
  similarity_score float,
  match_reasons text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      c.id,
      c.content,
      c.hook,
      c.hook_type,
      c.script_archetype,
      c.parasocial_levers,
      c.quality_score,
      -- Similarity with quality boost
      1 - (c.embedding <=> query_embedding) + (COALESCE(c.quality_score, 0.5) * 0.1) AS sim_score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN archetype_filter IS NOT NULL AND c.script_archetype = ANY(archetype_filter) THEN 'archetype_match' END,
        CASE WHEN lever_filter IS NOT NULL AND c.parasocial_levers && lever_filter THEN 'lever_match' END
      ], NULL) AS reasons,
      -- Rank within each hook type
      ROW_NUMBER() OVER (PARTITION BY c.hook_type ORDER BY 1 - (c.embedding <=> query_embedding) DESC) AS rank_in_type
    FROM corpus c
    WHERE
      c.embedding IS NOT NULL
      AND c.is_active = true
      AND 1 - (c.embedding <=> query_embedding) >= min_similarity
      AND (archetype_filter IS NULL OR c.script_archetype = ANY(archetype_filter))
      AND (lever_filter IS NULL OR c.parasocial_levers && lever_filter)
  )
  SELECT
    r.id,
    r.content,
    r.hook,
    r.hook_type,
    r.script_archetype,
    r.parasocial_levers,
    r.quality_score,
    r.sim_score AS similarity_score,
    r.reasons AS match_reasons
  FROM ranked r
  WHERE r.rank_in_type <= per_hook_type
  ORDER BY r.sim_score DESC
  LIMIT total_count;
END;
$$;

-- Grant access to all roles
GRANT EXECUTE ON FUNCTION match_corpus_hybrid TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION match_corpus_diversified TO authenticated, anon, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION match_corpus_hybrid IS
'Hybrid corpus search with metadata filtering and vector similarity.
Filters by archetype, parasocial levers, hook type.
Returns matches with quality-boosted similarity scores.';

COMMENT ON FUNCTION match_corpus_diversified IS
'Diversified corpus search ensuring variety across hook types.
Returns top N per hook type to prevent repetitive results.';
