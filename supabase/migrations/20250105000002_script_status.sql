-- Add status and tracking fields to scripts
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated';
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS posted_url TEXT;

-- Add metadata JSON column for flexible storage
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ensure voice_fidelity_score column exists
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS voice_fidelity_score DECIMAL(5,2);

-- Ensure parasocial_levers column exists
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS parasocial_levers TEXT[];

-- Ensure estimated_duration column exists (rename from duration_seconds if needed)
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_model_status ON scripts(model_id, status);
