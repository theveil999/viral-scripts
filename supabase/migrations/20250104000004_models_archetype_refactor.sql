-- ============================================================================
-- Models Archetype Refactor
-- ============================================================================
-- Design Change: Archetypes are now optional classification tags.
-- voice_profile JSONB is the source of truth for script generation.
--
-- The voice_profile JSONB contains archetype_assignment internally:
-- {
--   "archetype_assignment": {
--     "primary": "chaotic_unhinged",
--     "secondary": "southern_belle",
--     "mix": {"chaotic_unhinged": 0.5, "gym_baddie": 0.3, "southern_belle": 0.2},
--     "confidence": 0.85
--   },
--   ...rest of voice profile (energy, explicitness, phrases, etc.)
-- }
--
-- The archetypes table now serves as:
-- 1. Reference lookup for valid archetype names
-- 2. Stores effectiveness patterns for corpus retrieval and batch diversity
-- 3. NOT a hard constraint on models
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Models Table Changes
-- ----------------------------------------------------------------------------

-- Remove single archetype constraint columns
ALTER TABLE models DROP COLUMN IF EXISTS archetype;
ALTER TABLE models DROP COLUMN IF EXISTS archetype_confidence;

-- Add optional archetype tags for quick filtering/searching
ALTER TABLE models ADD COLUMN archetype_tags TEXT[] DEFAULT '{}';

-- Add comment explaining the design
COMMENT ON TABLE models IS 'Creator profiles. voice_profile JSONB is the source of truth for script generation. archetype_tags are optional labels for filtering.';
COMMENT ON COLUMN models.voice_profile IS 'Source of truth containing energy, explicitness, phrases, and archetype_assignment with weighted mix';
COMMENT ON COLUMN models.archetype_tags IS 'Optional classification tags like [''chaotic_unhinged'', ''southern_belle''] for quick filtering';

-- ----------------------------------------------------------------------------
-- Archetypes Table Changes
-- ----------------------------------------------------------------------------

-- Add is_active flag to allow deprecating archetypes without deletion
ALTER TABLE archetypes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

COMMENT ON TABLE archetypes IS 'Reference lookup for archetype names and effectiveness patterns. Used for corpus retrieval and batch diversity, NOT as a hard constraint on models.';
COMMENT ON COLUMN archetypes.is_active IS 'Allows deprecating archetypes without deletion';

-- Create index for archetype_tags array searches
CREATE INDEX idx_models_archetype_tags ON models USING GIN (archetype_tags);
