-- Create function for corpus similarity search using pgvector
CREATE OR REPLACE FUNCTION match_corpus(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  filter_archetypes text[] DEFAULT NULL,
  filter_levers text[] DEFAULT NULL,
  min_quality float DEFAULT 0.7
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
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.hook,
    c.hook_type,
    c.script_archetype,
    c.parasocial_levers,
    c.quality_score::float,
    c.creator,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  FROM corpus c
  WHERE c.embedding IS NOT NULL
    AND c.is_active = true
    AND (c.quality_score IS NULL OR c.quality_score >= min_quality)
    -- Filter by archetypes if provided
    AND (
      filter_archetypes IS NULL
      OR array_length(filter_archetypes, 1) IS NULL
      OR c.script_archetype = ANY(filter_archetypes)
      OR c.script_archetype IS NULL
    )
    -- Filter by parasocial levers if provided (array overlap)
    AND (
      filter_levers IS NULL
      OR array_length(filter_levers, 1) IS NULL
      OR c.parasocial_levers && filter_levers
      OR c.parasocial_levers IS NULL
    )
    -- Similarity threshold
    AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add index for faster vector search if not exists
CREATE INDEX IF NOT EXISTS corpus_embedding_idx ON corpus
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON FUNCTION match_corpus IS 'Vector similarity search for corpus entries with optional filtering by archetype and parasocial levers';
