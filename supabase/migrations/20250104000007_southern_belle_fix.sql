-- ============================================================================
-- Fix: Add protector_dynamic to southern_belle
-- ============================================================================

UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'protector_dynamic')
WHERE name = 'southern_belle'
  AND NOT ('protector_dynamic' = ANY(effective_parasocial_levers));
