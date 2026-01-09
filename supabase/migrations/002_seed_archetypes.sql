-- Seed archetypes table with 13 archetypes from spec Section 7
-- These are the reference patterns for model classification and script generation
-- Source: VIRAL_SCRIPT_SYSTEM_SPEC.md Section 7 - Archetype Definitions
--
-- UPDATED: Added missing levers (praise, playful_self_deprecation) and new levers
-- (pseudo_intimacy, boyfriend_fantasy, protector_dynamic) where appropriate.
--
-- LEVER OVERRIDE PRIORITY (for script generation):
--   1. voice_profile.parasocial.strengths (if not empty)
--   2. archetype's effective_parasocial_levers (this table)
--   3. Always exclude voice_profile.parasocial.avoid

-- Clear existing archetypes and reseed
TRUNCATE TABLE archetypes CASCADE;

INSERT INTO archetypes (name, description, effective_hook_types, effective_parasocial_levers, effective_script_archetypes, typical_energy_level, typical_explicitness, common_phrases) VALUES

-- 1. girl_next_door
-- Added: playful_self_deprecation (humanizes the sweet persona), boyfriend_fantasy (naughty side)
('girl_next_door',
 'Approachable, relatable, sweet with a naughty side',
 ARRAY['bold_statement', 'question', 'relatable', 'confession'],
 ARRAY['relatability', 'vulnerability', 'direct_address', 'playful_self_deprecation', 'boyfriend_fantasy'],
 ARRAY['thirst_commentary', 'confession', 'relatable_rant'],
 'medium',
 'subtle',
 ARRAY['you know what I mean?', 'is it just me or', 'okay but like']
),

-- 2. bratty_princess
-- Added: praise (giving/withholding as power move)
('bratty_princess',
 'Demanding, playful, knows what she wants',
 ARRAY['bold_statement', 'challenge', 'fantasy'],
 ARRAY['challenge', 'exclusivity', 'sexual_tension', 'praise'],
 ARRAY['fantasy_desire', 'praise_dynamic', 'thirst_commentary'],
 'high',
 'medium',
 ARRAY['I want', 'I need', 'you better', 'give me']
),

-- 3. gym_baddie
('gym_baddie',
 'Fitness-focused, confident, body-positive',
 ARRAY['bold_statement', 'challenge', 'advice'],
 ARRAY['aspiration', 'challenge', 'sexual_tension'],
 ARRAY['advice_tip', 'thirst_commentary', 'fantasy_desire'],
 'high',
 'medium',
 ARRAY['gains', 'built different', 'no excuses', 'gym girl']
),

-- 4. alt_egirl
-- Added: playful_self_deprecation (edgy, self-aware), pseudo_intimacy (mysterious secrets)
('alt_egirl',
 'Alternative aesthetic, edgy, mysterious',
 ARRAY['confession', 'hot_take', 'question'],
 ARRAY['vulnerability', 'confession', 'inside_reference', 'playful_self_deprecation', 'pseudo_intimacy'],
 ARRAY['confession', 'relatable_rant', 'fantasy_desire'],
 'medium',
 'medium',
 ARRAY['vibes', 'aesthetic', 'dark', 'edgy']
),

-- 5. classy_mysterious
-- Added: pseudo_intimacy (fits sophisticated "just between us" vibe)
('classy_mysterious',
 'Sophisticated, teasing, less explicit',
 ARRAY['bold_statement', 'fantasy', 'question'],
 ARRAY['sexual_tension', 'exclusivity', 'aspiration', 'pseudo_intimacy'],
 ARRAY['fantasy_desire', 'thirst_commentary'],
 'low',
 'subtle',
 ARRAY['elegance', 'refined', 'selective', 'worth it']
),

-- 6. party_girl
-- Added: playful_self_deprecation (fits chaotic story energy)
('party_girl',
 'High energy, fun, social, wild stories',
 ARRAY['storytime', 'confession', 'bold_statement'],
 ARRAY['confession', 'vulnerability', 'relatability', 'playful_self_deprecation'],
 ARRAY['confession', 'relatable_rant', 'thirst_commentary'],
 'high',
 'full_send',
 ARRAY['one time', 'so basically', 'no but seriously', 'wild']
),

-- 7. nerdy_gamer_girl
-- Added: playful_self_deprecation (self-aware gamer humor)
('nerdy_gamer_girl',
 'Gamer/nerd culture, relatable, playful',
 ARRAY['question', 'relatable', 'challenge'],
 ARRAY['relatability', 'inside_reference', 'direct_address', 'playful_self_deprecation'],
 ARRAY['relatable_rant', 'chain_game', 'thirst_commentary'],
 'medium',
 'subtle',
 ARRAY['gamers know', 'touch grass', 'main character', 'NPC energy']
),

-- 8. spicy_latina
('spicy_latina',
 'Passionate, fiery, expressive',
 ARRAY['bold_statement', 'challenge', 'fantasy'],
 ARRAY['sexual_tension', 'challenge', 'vulnerability'],
 ARRAY['thirst_commentary', 'fantasy_desire', 'confession'],
 'high',
 'full_send',
 ARRAY['papi', 'mami', 'ay', 'caliente']
),

-- 9. southern_belle
-- Added: pseudo_intimacy (sweet secretive charm), boyfriend_fantasy, protector_dynamic (caretaker energy)
('southern_belle',
 'Sweet with edge, charming, country elements',
 ARRAY['relatable', 'confession', 'bold_statement'],
 ARRAY['relatability', 'confession', 'vulnerability', 'pseudo_intimacy', 'boyfriend_fantasy', 'protector_dynamic'],
 ARRAY['confession', 'relatable_rant', 'advice_tip'],
 'medium',
 'medium',
 ARRAY['bless your heart', 'honey', 'yall', 'fixin to']
),

-- 10. cool_girl
('cool_girl',
 'Into cars, sports, one of the guys vibe',
 ARRAY['bold_statement', 'challenge', 'relatable'],
 ARRAY['relatability', 'inside_reference', 'challenge'],
 ARRAY['thirst_commentary', 'relatable_rant', 'advice_tip'],
 'medium',
 'medium',
 ARRAY['bro', 'dude', 'lowkey', 'no cap']
),

-- 11. chaotic_unhinged
-- Added: playful_self_deprecation (core to the unhinged brand)
('chaotic_unhinged',
 'Unpredictable, wild, no filter',
 ARRAY['confession', 'hot_take', 'storytime', 'bold_statement'],
 ARRAY['confession', 'vulnerability', 'relatability', 'playful_self_deprecation'],
 ARRAY['confession', 'relatable_rant', 'thirst_commentary'],
 'high',
 'full_send',
 ARRAY['okay so', 'I have no filter', 'hear me out', 'I need help']
),

-- 12. soft_sensual
-- Added: protector_dynamic, pseudo_intimacy, boyfriend_fantasy (core GFE levers)
('soft_sensual',
 'Slow, intimate, ASMR-adjacent',
 ARRAY['fantasy', 'roleplay', 'bold_statement'],
 ARRAY['sexual_tension', 'direct_address', 'vulnerability', 'protector_dynamic', 'pseudo_intimacy', 'boyfriend_fantasy'],
 ARRAY['fantasy_desire', 'roleplay', 'praise_dynamic'],
 'low',
 'medium',
 ARRAY['come here', 'let me', 'slowly', 'feel']
),

-- 13. dominant
-- Added: praise (core to dom dynamic - rewarding/withholding)
('dominant',
 'In control, commanding, powerful',
 ARRAY['roleplay', 'challenge', 'bold_statement'],
 ARRAY['challenge', 'exclusivity', 'sexual_tension', 'dominance', 'praise'],
 ARRAY['praise_dynamic', 'roleplay', 'fantasy_desire'],
 'medium',
 'full_send',
 ARRAY['you will', 'good boy', 'listen', 'obey']
);
