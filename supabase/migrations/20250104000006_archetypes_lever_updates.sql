-- ============================================================================
-- Archetypes Lever Updates
-- ============================================================================
-- Updates archetype effective_parasocial_levers with missing levers and
-- adds the 3 new levers (pseudo_intimacy, boyfriend_fantasy, protector_dynamic)
-- to archetypes where they fit naturally.
-- ============================================================================

-- bratty_princess: add 'praise' (giving/withholding dynamic)
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'praise')
WHERE name = 'bratty_princess'
  AND NOT ('praise' = ANY(effective_parasocial_levers));

-- dominant: add 'praise'
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'praise')
WHERE name = 'dominant'
  AND NOT ('praise' = ANY(effective_parasocial_levers));

-- chaotic_unhinged: add 'playful_self_deprecation'
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'playful_self_deprecation')
WHERE name = 'chaotic_unhinged'
  AND NOT ('playful_self_deprecation' = ANY(effective_parasocial_levers));

-- girl_next_door: add 'playful_self_deprecation', 'pseudo_intimacy', 'boyfriend_fantasy'
UPDATE archetypes
SET effective_parasocial_levers = array_cat(
    effective_parasocial_levers,
    ARRAY['playful_self_deprecation', 'pseudo_intimacy', 'boyfriend_fantasy']
)
WHERE name = 'girl_next_door';

-- Remove duplicates from girl_next_door
UPDATE archetypes
SET effective_parasocial_levers = (
    SELECT ARRAY(SELECT DISTINCT unnest(effective_parasocial_levers))
)
WHERE name = 'girl_next_door';

-- soft_sensual: add 'protector_dynamic', 'pseudo_intimacy', 'boyfriend_fantasy'
UPDATE archetypes
SET effective_parasocial_levers = array_cat(
    effective_parasocial_levers,
    ARRAY['protector_dynamic', 'pseudo_intimacy', 'boyfriend_fantasy']
)
WHERE name = 'soft_sensual';

-- Remove duplicates from soft_sensual
UPDATE archetypes
SET effective_parasocial_levers = (
    SELECT ARRAY(SELECT DISTINCT unnest(effective_parasocial_levers))
)
WHERE name = 'soft_sensual';

-- nerdy_gamer_girl: add 'playful_self_deprecation' (inside_reference already present)
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'playful_self_deprecation')
WHERE name = 'nerdy_gamer_girl'
  AND NOT ('playful_self_deprecation' = ANY(effective_parasocial_levers));

-- classy_mysterious: add 'pseudo_intimacy' (fits the mysterious private feeling)
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'pseudo_intimacy')
WHERE name = 'classy_mysterious'
  AND NOT ('pseudo_intimacy' = ANY(effective_parasocial_levers));

-- southern_belle: add 'pseudo_intimacy', 'boyfriend_fantasy' (sweet charm)
UPDATE archetypes
SET effective_parasocial_levers = array_cat(
    effective_parasocial_levers,
    ARRAY['pseudo_intimacy', 'boyfriend_fantasy']
)
WHERE name = 'southern_belle';

-- Remove duplicates from southern_belle
UPDATE archetypes
SET effective_parasocial_levers = (
    SELECT ARRAY(SELECT DISTINCT unnest(effective_parasocial_levers))
)
WHERE name = 'southern_belle';

-- party_girl: add 'playful_self_deprecation' (wild, self-aware)
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'playful_self_deprecation')
WHERE name = 'party_girl'
  AND NOT ('playful_self_deprecation' = ANY(effective_parasocial_levers));

-- alt_egirl: add 'pseudo_intimacy' (mysterious, private)
UPDATE archetypes
SET effective_parasocial_levers = array_append(effective_parasocial_levers, 'pseudo_intimacy')
WHERE name = 'alt_egirl'
  AND NOT ('pseudo_intimacy' = ANY(effective_parasocial_levers));
