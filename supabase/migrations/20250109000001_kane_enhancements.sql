-- Kane Framework Enhancements Migration
-- Adds support for hook variations, shareability scoring, CTAs, and PCM tracking

-- =============================================
-- SCRIPTS TABLE ADDITIONS
-- =============================================

-- Add variation tracking
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS variation_group_id UUID;

-- Add shareability scoring
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS shareability_score INTEGER CHECK (shareability_score >= 0 AND shareability_score <= 100);
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS share_trigger TEXT;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS share_prediction TEXT;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS emotional_response TEXT;

-- Add organic CTA tracking
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS cta_type TEXT;

-- Add PCM (Process Communication Model) type tracking
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS pcm_type TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_scripts_variation_group ON scripts(variation_group_id);
CREATE INDEX IF NOT EXISTS idx_scripts_shareability ON scripts(shareability_score);
CREATE INDEX IF NOT EXISTS idx_scripts_cta_type ON scripts(cta_type);
CREATE INDEX IF NOT EXISTS idx_scripts_pcm_type ON scripts(pcm_type);

-- =============================================
-- SCRIPT VARIATION GROUPS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS script_variation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  concept_description TEXT,
  hook_count INTEGER DEFAULT 0,
  best_performing_variation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from scripts to variation groups
ALTER TABLE scripts 
  ADD CONSTRAINT fk_scripts_variation_group 
  FOREIGN KEY (variation_group_id) 
  REFERENCES script_variation_groups(id) 
  ON DELETE SET NULL;

-- Add self-referential FK for best performing variation
ALTER TABLE script_variation_groups
  ADD CONSTRAINT fk_best_variation
  FOREIGN KEY (best_performing_variation_id)
  REFERENCES scripts(id)
  ON DELETE SET NULL;

-- Index for variation groups
CREATE INDEX IF NOT EXISTS idx_variation_groups_model ON script_variation_groups(model_id);

-- =============================================
-- HOOKS TABLE ADDITIONS
-- =============================================

-- Add variation and PCM tracking to hooks table
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS variation_group_id UUID;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS pcm_type TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS variation_strategy TEXT;
ALTER TABLE hooks ADD COLUMN IF NOT EXISTS shareability_score INTEGER CHECK (shareability_score >= 0 AND shareability_score <= 100);

-- Indexes for hooks
CREATE INDEX IF NOT EXISTS idx_hooks_variation_group ON hooks(variation_group_id);
CREATE INDEX IF NOT EXISTS idx_hooks_pcm_type ON hooks(pcm_type);

-- =============================================
-- A/B TEST RESULTS TABLE (for tracking variation performance)
-- =============================================

CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_group_id UUID NOT NULL REFERENCES script_variation_groups(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  
  -- Performance metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- Calculated metrics
  engagement_rate DECIMAL(5,4), -- (likes + comments + shares + saves) / views
  share_rate DECIMAL(5,4),      -- shares / views
  
  -- Test metadata
  test_started_at TIMESTAMPTZ,
  test_ended_at TIMESTAMPTZ,
  is_winner BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_results_variation_group ON ab_test_results(variation_group_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_script ON ab_test_results(script_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_winner ON ab_test_results(is_winner) WHERE is_winner = TRUE;

-- =============================================
-- PCM DISTRIBUTION TRACKING VIEW
-- =============================================

CREATE OR REPLACE VIEW pcm_distribution AS
SELECT 
  model_id,
  pcm_type,
  COUNT(*) as hook_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY model_id), 2) as percentage
FROM scripts
WHERE pcm_type IS NOT NULL
GROUP BY model_id, pcm_type
ORDER BY model_id, percentage DESC;

-- =============================================
-- SHAREABILITY ANALYTICS VIEW
-- =============================================

CREATE OR REPLACE VIEW shareability_analytics AS
SELECT 
  s.model_id,
  m.name as model_name,
  s.share_trigger,
  s.cta_type,
  COUNT(*) as script_count,
  ROUND(AVG(s.shareability_score), 1) as avg_shareability,
  ROUND(AVG(COALESCE(p.shares, 0)), 1) as avg_shares,
  ROUND(AVG(COALESCE(p.views, 0)), 1) as avg_views
FROM scripts s
JOIN models m ON s.model_id = m.id
LEFT JOIN performance p ON s.id = p.script_id
WHERE s.shareability_score IS NOT NULL
GROUP BY s.model_id, m.name, s.share_trigger, s.cta_type
ORDER BY avg_shareability DESC;

-- =============================================
-- UPDATE TRIGGER FOR VARIATION GROUPS
-- =============================================

CREATE OR REPLACE FUNCTION update_variation_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variation_groups_updated ON script_variation_groups;
CREATE TRIGGER trg_variation_groups_updated
  BEFORE UPDATE ON script_variation_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_variation_group_timestamp();

-- =============================================
-- FUNCTION: Calculate winner from A/B test
-- =============================================

CREATE OR REPLACE FUNCTION calculate_ab_winner(p_variation_group_id UUID)
RETURNS UUID AS $$
DECLARE
  winner_id UUID;
BEGIN
  -- Find the script with highest engagement rate
  SELECT script_id INTO winner_id
  FROM ab_test_results
  WHERE variation_group_id = p_variation_group_id
    AND views > 100  -- Minimum views threshold
  ORDER BY engagement_rate DESC NULLS LAST
  LIMIT 1;
  
  -- Mark as winner
  IF winner_id IS NOT NULL THEN
    UPDATE ab_test_results 
    SET is_winner = FALSE 
    WHERE variation_group_id = p_variation_group_id;
    
    UPDATE ab_test_results 
    SET is_winner = TRUE 
    WHERE script_id = winner_id;
    
    UPDATE script_variation_groups 
    SET best_performing_variation_id = winner_id
    WHERE id = p_variation_group_id;
  END IF;
  
  RETURN winner_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE script_variation_groups IS 'Groups of script variations for A/B testing - Kane Framework';
COMMENT ON TABLE ab_test_results IS 'Performance tracking for A/B test variations';
COMMENT ON COLUMN scripts.shareability_score IS 'Predicted viral share potential (0-100) - Kane Framework';
COMMENT ON COLUMN scripts.share_trigger IS 'Primary reason someone would share (tag_friend, self_identification, etc)';
COMMENT ON COLUMN scripts.cta_type IS 'Organic CTA type used (fantasy_invitation, keeper_signal, etc)';
COMMENT ON COLUMN scripts.pcm_type IS 'Process Communication Model personality type (harmonizer, thinker, rebel, etc)';
COMMENT ON VIEW pcm_distribution IS 'Shows distribution of PCM types across models';
COMMENT ON VIEW shareability_analytics IS 'Analytics on shareability patterns and performance';

