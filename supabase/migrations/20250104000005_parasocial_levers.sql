-- ============================================================================
-- Parasocial Levers Reference Table
-- ============================================================================
-- Reference table for all parasocial engagement levers used in script generation.
--
-- Model-level override system (in voice_profile JSONB):
-- {
--   "parasocial_config": {
--     "strengths": ["confession", "vulnerability", "boyfriend_fantasy"],
--     "avoid": ["dominance"],
--     "custom_levers": []
--   }
-- }
--
-- System priority for lever selection:
-- 1. Check voice_profile.parasocial_config.strengths (if not empty, use these)
-- 2. Fall back to archetype's effective_parasocial_levers
-- 3. Always exclude voice_profile.parasocial_config.avoid
-- ============================================================================

CREATE TABLE parasocial_levers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    implementation_notes TEXT,
    example TEXT,
    intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('low', 'medium', 'high')),
    usage_guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for name lookups
CREATE INDEX idx_parasocial_levers_name ON parasocial_levers(name);
CREATE INDEX idx_parasocial_levers_intensity ON parasocial_levers(intensity);

-- Insert all 15 parasocial levers
INSERT INTO parasocial_levers (name, description, implementation_notes, example, intensity, usage_guidance) VALUES

-- 1. Direct Address
(
    'direct_address',
    'Speaking directly to "you", making it personal',
    'Use second person pronouns throughout. Start sentences with "you" or include viewer as participant.',
    'I need to tell you something...',
    'low',
    'Use in 80%+ of scripts, foundation lever. Creates immediate personal connection.'
),

-- 2. Sexual Tension
(
    'sexual_tension',
    'Suggestive without explicit, building desire',
    'Use implications, double meanings, loaded pauses. Reference physical without being graphic.',
    'back shots, pink taco, implication without explicit description',
    'high',
    'Core for thirst content, calibrate to model''s explicitness_level. Build tension, don''t release it.'
),

-- 3. Relatability
(
    'relatability',
    'Shared common experience',
    'Reference universal experiences, frustrations, or observations. Use "we" and "us" language.',
    'Do you ever..., Why do guys always...',
    'low',
    'Great for openers, builds "she gets me" feeling. Works across all archetypes.'
),

-- 4. Vulnerability
(
    'vulnerability',
    'Sharing something personal, uncomfortable, real',
    'Reveal genuine insecurities or fears. Requires authentic-sounding delivery.',
    'I''ve never told anyone this but...',
    'high',
    'Highest engagement but use sparingly (30-40% of batch). Must feel earned, not performative.'
),

-- 5. Confession
(
    'confession',
    'Admitting something taboo or surprising',
    'Frame as admission of guilt or embarrassment. Works best with unexpected content.',
    'My toxic trait is..., I''m not ashamed to admit...',
    'high',
    'Highest engagement but use sparingly (30-40% of batch). Creates intimacy through shared secrets.'
),

-- 6. Exclusivity
(
    'exclusivity',
    'Making viewer feel special, insider',
    'Create in-group language. Reference "real ones" vs casual viewers.',
    'Only my real ones..., I don''t tell everyone this...',
    'medium',
    'Rewards loyal viewers, builds community. Good for retention content.'
),

-- 7. Challenge
(
    'challenge',
    'Provocative, creating intrigue',
    'Question viewer capability or worth. Create desire to prove themselves.',
    'Most guys couldn''t handle..., If your girl doesn''t...',
    'medium',
    'Creates desire to prove/qualify, good for engagement. Works well with bratty_princess, gym_baddie.'
),

-- 8. Praise
(
    'praise',
    'Good boy/girl dynamics, rewarding viewer',
    'Positive reinforcement language. Can be given or withheld for dynamic.',
    'Good boy, You''ve been such a good boy...',
    'medium',
    'Works for dominant archetypes, careful with tone. Can be patronizing if misused.'
),

-- 9. Dominance
(
    'dominance',
    'Commanding energy, power dynamic',
    'Direct commands, expectations of obedience. Confident, non-negotiable tone.',
    'Listen to me, It''s time for obedience training...',
    'high',
    'Not for all models, check boundaries. Only use with dominant, soft_sensual archetypes or explicit consent.'
),

-- 10. Playful Self-Deprecation
(
    'playful_self_deprecation',
    'Humanizing through gentle self-mockery',
    'Light self-criticism that''s endearing not sad. Shows self-awareness.',
    'I need help, I''m evil, There''s something wrong with me...',
    'low',
    'Humanizes, pairs well with vulnerability. Great for chaotic_unhinged, girl_next_door.'
),

-- 11. Inside Reference
(
    'inside_reference',
    'Callbacks that reward loyal viewers',
    'Reference previous content, running jokes, or community moments.',
    'You know how I always say...',
    'low',
    'Build over time, requires content history. Strengthens community bonds.'
),

-- 12. Aspiration
(
    'aspiration',
    'Glimpse of desirable lifestyle',
    'Casual mentions of luxury, travel, or enviable experiences.',
    'So I just got back from...',
    'low',
    'Subtle flex, don''t overdo. Creates aspirational connection without bragging.'
),

-- 13. Pseudo Intimacy
(
    'pseudo_intimacy',
    '"Just between us" private feeling',
    'Create sense of secret sharing. Lower voice, conspiratorial tone.',
    'I probably shouldn''t say this but..., Don''t tell anyone...',
    'medium',
    'Creates sense of private conversation, distinct from exclusivity. Works for soft_sensual, girl_next_door.'
),

-- 14. Boyfriend Fantasy
(
    'boyfriend_fantasy',
    'Simulated romantic relationship',
    'Domestic scenarios, couple activities, emotional availability.',
    'When you get home I''ll..., I made you dinner...',
    'high',
    'Major OF conversion driver, GFE content. High engagement but use strategically for conversion.'
),

-- 15. Protector Dynamic
(
    'protector_dynamic',
    '"I''ll take care of you" nurturing',
    'Caretaking language, comfort offering, safe space creation.',
    'Come here, let me take care of you..., You''ve had a long day...',
    'medium',
    'Inverse of dominance, nurturing power. Works for soft_sensual archetype, appeals to stress/comfort needs.'
);

COMMENT ON TABLE parasocial_levers IS 'Reference table for parasocial engagement levers. Used for script generation and model configuration.';
