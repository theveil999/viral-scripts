-- Add hook-specific embedding for better deduplication
-- Embedding the hook separately from full script enables more accurate duplicate detection

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS hook_embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_scripts_hook_embedding
ON scripts USING ivfflat (hook_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment for documentation
COMMENT ON COLUMN scripts.hook_embedding IS 'Embedding of just the hook text for semantic deduplication';
