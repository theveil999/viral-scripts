-- Function to find similar hooks for a model
-- Used for semantic deduplication during hook generation

CREATE OR REPLACE FUNCTION match_similar_hooks(
  query_embedding vector(1536),
  match_model_id uuid,
  match_threshold float DEFAULT 0.85,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  hook text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.hook,
    1 - (s.embedding <=> query_embedding) as similarity
  FROM scripts s
  WHERE s.model_id = match_model_id
    AND s.embedding IS NOT NULL
    AND s.hook IS NOT NULL
    AND s.status != 'archived'
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Also create a function specifically for hook embeddings once we add that column
CREATE OR REPLACE FUNCTION match_hooks_by_embedding(
  query_embedding vector(1536),
  match_model_id uuid,
  match_threshold float DEFAULT 0.85,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  hook text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.hook,
    1 - (s.hook_embedding <=> query_embedding) as similarity
  FROM scripts s
  WHERE s.model_id = match_model_id
    AND s.hook_embedding IS NOT NULL
    AND s.hook IS NOT NULL
    AND s.status != 'archived'
    AND 1 - (s.hook_embedding <=> query_embedding) > match_threshold
  ORDER BY s.hook_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
