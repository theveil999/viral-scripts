-- Track script generation batches for analytics
CREATE TABLE IF NOT EXISTS script_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT UNIQUE NOT NULL,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,

  -- Generation stats
  hooks_requested INTEGER NOT NULL,
  scripts_generated INTEGER NOT NULL,
  scripts_passed INTEGER NOT NULL,
  scripts_failed INTEGER NOT NULL,

  -- Quality metrics
  avg_voice_fidelity DECIMAL(5,2),
  avg_word_count DECIMAL(5,1),

  -- Performance
  total_time_ms INTEGER,
  total_tokens INTEGER,

  -- Costs (calculated)
  estimated_cost_usd DECIMAL(10,4),

  -- Metadata
  pipeline_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_script_batches_model ON script_batches(model_id);
CREATE INDEX IF NOT EXISTS idx_script_batches_created ON script_batches(created_at DESC);

-- Add batch_id to scripts table if not exists
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS batch_id TEXT;
CREATE INDEX IF NOT EXISTS idx_scripts_batch ON scripts(batch_id);
