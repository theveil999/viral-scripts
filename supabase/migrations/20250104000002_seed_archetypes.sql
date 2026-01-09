-- ============================================================================
-- Seed Archetypes Reference Data
-- ============================================================================
-- This migration populates the archetypes table with the 8 core creator
-- archetypes and their effectiveness patterns for hook types, parasocial
-- levers, and script archetypes.
-- ============================================================================

INSERT INTO archetypes (name, description, effective_hook_types, effective_parasocial_levers, effective_script_archetypes, typical_energy_level, typical_explicitness, common_phrases) VALUES

-- 1. Girl Next Door
(
    'girl_next_door',
    'Approachable, relatable, sweet with a naughty side',
    ARRAY['bold_statement', 'question', 'relatable', 'confession'],
    ARRAY['relatability', 'vulnerability', 'direct_address', 'playful_self_deprecation'],
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
    ARRAY['challenge', 'exclusivity', 'sexual_tension', 'dominance'],
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
    ARRAY['aspiration', 'challenge', 'sexual_tension', 'direct_address'],
    ARRAY['advice_tip', 'thirst_commentary', 'fantasy_desire'],
    'high',
    'medium',
    ARRAY['gains', 'pump', 'built different', 'no excuses']
),

-- 4. Chaotic Unhinged
(
    'chaotic_unhinged',
    'Unpredictable, wild, zero filter',
    ARRAY['confession', 'hot_take', 'storytime', 'bold_statement'],
    ARRAY['vulnerability', 'confession', 'playful_self_deprecation', 'relatability'],
    ARRAY['confession', 'relatable_rant', 'storytime'],
    'high',
    'full_send',
    ARRAY['okay so', 'I have no filter', 'hear me out', 'unhinged']
),

-- 5. Soft Dom
(
    'soft_dom',
    'Gentle dominance, nurturing control, praise-focused',
    ARRAY['roleplay', 'fantasy', 'bold_statement'],
    ARRAY['dominance', 'praise', 'direct_address', 'exclusivity'],
    ARRAY['praise_dynamic', 'roleplay', 'fantasy_desire'],
    'medium',
    'medium',
    ARRAY['good boy', 'come here', 'thats it', 'for me']
),

-- 6. Spicy Gamer
(
    'spicy_gamer',
    'Gaming culture, nerdy hot, competitive',
    ARRAY['challenge', 'question', 'relatable', 'hot_take'],
    ARRAY['relatability', 'challenge', 'inside_reference', 'playful_self_deprecation'],
    ARRAY['relatable_rant', 'thirst_commentary', 'chain_game'],
    'high',
    'subtle',
    ARRAY['gamers know', 'rage quit', 'touch grass', 'carried']
),

-- 7. MILF Energy
(
    'milf_energy',
    'Mature confidence, experienced, commanding',
    ARRAY['bold_statement', 'advice', 'fantasy', 'confession'],
    ARRAY['dominance', 'sexual_tension', 'vulnerability', 'aspiration'],
    ARRAY['advice_tip', 'fantasy_desire', 'confession'],
    'medium',
    'full_send',
    ARRAY['let me teach you', 'experienced', 'I know what I want']
),

-- 8. Cottagecore Cutie
(
    'cottagecore_cutie',
    'Soft aesthetic, wholesome with hidden spice',
    ARRAY['relatable', 'fantasy', 'confession', 'question'],
    ARRAY['vulnerability', 'relatability', 'exclusivity', 'aspiration'],
    ARRAY['confession', 'fantasy_desire', 'relatable_rant'],
    'low',
    'subtle',
    ARRAY['cozy', 'soft', 'gentle', 'sweet']
);
