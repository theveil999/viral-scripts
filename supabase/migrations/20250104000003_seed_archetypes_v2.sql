-- ============================================================================
-- Seed Archetypes Reference Data (v2) - Section 7 Spec
-- ============================================================================
-- This migration populates the archetypes table with the 13 core creator
-- archetypes from the specification's Archetype Definitions table (Section 7).
-- Each archetype includes effectiveness patterns for hook types, parasocial
-- levers, and script archetypes.
-- ============================================================================

-- Clear existing archetypes and reseed with full 13 from spec
TRUNCATE TABLE archetypes CASCADE;

INSERT INTO archetypes (name, description, effective_hook_types, effective_parasocial_levers, effective_script_archetypes, typical_energy_level, typical_explicitness, common_phrases) VALUES

-- 1. Girl Next Door
(
    'girl_next_door',
    'Approachable, relatable, sweet with a naughty side',
    ARRAY['bold_statement', 'question', 'relatable', 'confession'],
    ARRAY['relatability', 'vulnerability', 'direct_address'],
    ARRAY['thirst_commentary', 'confession', 'relatable_rant'],
    'medium',
    'subtle',
    ARRAY['you know what I mean?', 'is it just me or', 'okay but like']
),

-- 2. Bratty Princess
(
    'bratty_princess',
    'Demanding, playful, knows what she wants',
    ARRAY['bold_statement', 'challenge', 'fantasy'],
    ARRAY['challenge', 'exclusivity', 'sexual_tension'],
    ARRAY['fantasy_desire', 'praise_dynamic', 'thirst_commentary'],
    'high',
    'medium',
    ARRAY['I want', 'I need', 'you better', 'give me']
),

-- 3. Gym Baddie
(
    'gym_baddie',
    'Fitness-focused, confident, body-positive',
    ARRAY['bold_statement', 'challenge', 'advice'],
    ARRAY['aspiration', 'challenge', 'sexual_tension'],
    ARRAY['advice_tip', 'thirst_commentary', 'fantasy_desire'],
    'high',
    'medium',
    ARRAY['gains', 'built different', 'no excuses', 'gym girl']
),

-- 4. Alt E-Girl
(
    'alt_egirl',
    'Alternative aesthetic, edgy, mysterious',
    ARRAY['confession', 'hot_take', 'question'],
    ARRAY['vulnerability', 'confession', 'inside_reference'],
    ARRAY['confession', 'relatable_rant', 'fantasy_desire'],
    'medium',
    'medium',
    ARRAY['vibes', 'aesthetic', 'dark', 'edgy']
),

-- 5. Classy Mysterious
(
    'classy_mysterious',
    'Sophisticated, teasing, less explicit',
    ARRAY['bold_statement', 'fantasy', 'question'],
    ARRAY['sexual_tension', 'exclusivity', 'aspiration'],
    ARRAY['fantasy_desire', 'thirst_commentary'],
    'low',
    'subtle',
    ARRAY['elegance', 'refined', 'selective', 'worth it']
),

-- 6. Party Girl
(
    'party_girl',
    'High energy, fun, social, wild stories',
    ARRAY['storytime', 'confession', 'bold_statement'],
    ARRAY['confession', 'vulnerability', 'relatability'],
    ARRAY['confession', 'relatable_rant', 'thirst_commentary'],
    'high',
    'full_send',
    ARRAY['one time', 'so basically', 'no but seriously', 'wild']
),

-- 7. Nerdy Gamer Girl
(
    'nerdy_gamer_girl',
    'Gamer/nerd culture, relatable, playful',
    ARRAY['question', 'relatable', 'challenge'],
    ARRAY['relatability', 'inside_reference', 'direct_address'],
    ARRAY['relatable_rant', 'chain_game', 'thirst_commentary'],
    'medium',
    'subtle',
    ARRAY['gamers know', 'touch grass', 'main character', 'NPC energy']
),

-- 8. Spicy Latina
(
    'spicy_latina',
    'Passionate, fiery, expressive',
    ARRAY['bold_statement', 'challenge', 'fantasy'],
    ARRAY['sexual_tension', 'challenge', 'vulnerability'],
    ARRAY['thirst_commentary', 'fantasy_desire', 'confession'],
    'high',
    'full_send',
    ARRAY['papi', 'mami', 'ay', 'caliente']
),

-- 9. Southern Belle
(
    'southern_belle',
    'Sweet with edge, charming, country elements',
    ARRAY['relatable', 'confession', 'bold_statement'],
    ARRAY['relatability', 'confession', 'vulnerability'],
    ARRAY['confession', 'relatable_rant', 'advice_tip'],
    'medium',
    'medium',
    ARRAY['bless your heart', 'honey', 'yall', 'fixin to']
),

-- 10. Cool Girl
(
    'cool_girl',
    'Into cars, sports, one of the guys vibe',
    ARRAY['bold_statement', 'challenge', 'relatable'],
    ARRAY['relatability', 'inside_reference', 'challenge'],
    ARRAY['thirst_commentary', 'relatable_rant', 'advice_tip'],
    'medium',
    'medium',
    ARRAY['bro', 'dude', 'lowkey', 'no cap']
),

-- 11. Chaotic Unhinged
(
    'chaotic_unhinged',
    'Unpredictable, wild, no filter',
    ARRAY['confession', 'hot_take', 'storytime', 'bold_statement'],
    ARRAY['confession', 'vulnerability', 'relatability'],
    ARRAY['confession', 'relatable_rant', 'thirst_commentary'],
    'high',
    'full_send',
    ARRAY['okay so', 'I have no filter', 'hear me out', 'I need help']
),

-- 12. Soft Sensual
(
    'soft_sensual',
    'Slow, intimate, ASMR-adjacent',
    ARRAY['fantasy', 'roleplay', 'bold_statement'],
    ARRAY['sexual_tension', 'direct_address', 'vulnerability'],
    ARRAY['fantasy_desire', 'roleplay', 'praise_dynamic'],
    'low',
    'medium',
    ARRAY['come here', 'let me', 'slowly', 'feel']
),

-- 13. Dominant
(
    'dominant',
    'In control, commanding, powerful',
    ARRAY['roleplay', 'challenge', 'bold_statement'],
    ARRAY['challenge', 'exclusivity', 'sexual_tension', 'dominance'],
    ARRAY['praise_dynamic', 'roleplay', 'fantasy_desire'],
    'medium',
    'full_send',
    ARRAY['you will', 'good boy', 'listen', 'obey']
);
