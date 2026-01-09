-- Fix column name inconsistency for duration
-- Code uses duration_seconds, DB had duration_estimate

-- Rename duration_estimate to duration_seconds if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scripts' AND column_name = 'duration_estimate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scripts' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE scripts RENAME COLUMN duration_estimate TO duration_seconds;
  END IF;
END $$;

-- Add duration_seconds if it doesn't exist at all
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Drop old estimated_duration column if it exists (was added in error)
ALTER TABLE scripts DROP COLUMN IF EXISTS estimated_duration;

-- Update default status from 'generated' to 'draft' for consistency
ALTER TABLE scripts ALTER COLUMN status SET DEFAULT 'draft';

-- Add comment
COMMENT ON COLUMN scripts.duration_seconds IS 'Estimated duration in seconds based on word count';

