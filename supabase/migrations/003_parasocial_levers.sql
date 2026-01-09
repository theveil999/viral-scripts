-- Parasocial Lever Reference Table
-- Version 1.0
--
-- OVERRIDE PRIORITY (for script generation):
--   1. Check voice_profile.parasocial.strengths (if not empty, use these)
--   2. Fall back to archetype's effective_parasocial_levers
--   3. Always exclude voice_profile.parasocial.avoid
--
-- This table serves as:
--   - Reference lookup for valid lever names
--   - Documentation of usage patterns
--   - NOT a hard constraint (models can define custom levers in voice_profile)

CREATE TABLE parasocial_levers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    implementation_notes TEXT,
    example TEXT,
    intensity TEXT DEFAULT 'medium',  -- low, medium, high
    usage_guidance TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 15 parasocial levers
INSERT INTO parasocial_levers (name, description, implementation_notes, example, intensity, usage_guidance) VALUES

-- ============================================
-- Original 12 levers from Spec Section 9
-- ============================================

('direct_address',
 'Speaking directly to "you", making it personal',
 'Use second person throughout, "you" in first 3 seconds',
 'I need to tell you something...',
 'low',
 'Use in 80%+ of scripts. Foundation lever that creates personal connection.'
),

('sexual_tension',
 'Suggestive without explicit, building desire',
 'Implication, teasing, explicit references calibrated to model',
 'back shots, pink taco, moan',
 'high',
 'Core for thirst content. Always calibrate to model''s explicitness_level in voice_profile.'
),

('relatability',
 'Shared common experience',
 '"Do you ever", "Have you ever", "Ladies", shared frustrations',
 'Why do guys always...',
 'low',
 'Great for openers. Builds "she gets me" feeling. Pairs well with confession.'
),

('vulnerability',
 'Sharing something personal, uncomfortable, real',
 'Admissions, embarrassments, insecurities, real feelings',
 'I''ve never told anyone this but...',
 'high',
 'Highest engagement lever. Use sparingly (30-40% of batch). Creates deep parasocial bond.'
),

('confession',
 'Admitting something taboo or surprising',
 '"My toxic trait", "I''m not ashamed to admit", owning flaws',
 'Okay I have to be honest...',
 'high',
 'Highest engagement lever. Use sparingly (30-40% of batch). Makes taboo feel normal.'
),

('exclusivity',
 'Making viewer feel special, insider',
 '"Only my real ones", "Send this to", "BTS", insider access',
 'I don''t tell everyone this...',
 'medium',
 'Rewards loyal viewers. Builds community. Good for retention content.'
),

('challenge',
 'Provocative, creating intrigue',
 '"If your", "If he doesn''t", "If she", conditional statements',
 'Most guys couldn''t handle...',
 'medium',
 'Creates desire to prove/qualify. Good for engagement and comments.'
),

('praise',
 'Good boy/girl dynamics, rewarding viewer',
 '"Good boy", "Good girl", affirmation, reward language',
 'You''ve been such a good boy...',
 'medium',
 'Works for dominant archetypes. Careful with tone - can feel cringe if forced.'
),

('dominance',
 'Commanding energy, power dynamic',
 '"Listen to", "Repeat after me", "Obedience", commands',
 'It''s time for obedience training...',
 'high',
 'Not for all models. Check boundaries. Works for dominant, bratty_princess.'
),

('playful_self_deprecation',
 'Humanizing through gentle self-mockery',
 '"I need help", "I''m evil", "Red flag", owning chaos',
 'There''s something wrong with me...',
 'low',
 'Humanizes creator. Pairs well with vulnerability. Good for chaotic archetypes.'
),

('inside_reference',
 'Callbacks that reward loyal viewers',
 'References to previous content, running jokes, lore',
 'You know how I always say...',
 'low',
 'Build over time. Requires content history. Strengthens community bond.'
),

('aspiration',
 'Glimpse of desirable lifestyle',
 'Casual mentions of lifestyle, experiences, travel',
 'So I just got back from...',
 'low',
 'Subtle flex. Don''t overdo - can feel braggy. Works for classy_mysterious.'
),

-- ============================================
-- 3 New levers (distinct value-add)
-- ============================================

('pseudo_intimacy',
 'Creating a "just between us" private feeling',
 '"I probably shouldn''t say this", "Don''t tell anyone", secretive tone',
 'I probably shouldn''t say this but...',
 'medium',
 'Creates sense of private conversation. Distinct from exclusivity (which is about being special, this is about being intimate/private).'
),

('boyfriend_fantasy',
 'Simulated romantic relationship elements',
 'GFE language, domestic scenarios, "when you get home", relationship simulation',
 'When you get home I''ll have dinner ready...',
 'high',
 'Major OF conversion driver. Core of GFE content. Use for models who do girlfriend experience.'
),

('protector_dynamic',
 '"I''ll take care of you" nurturing energy',
 'Nurturing language, caretaking, comfort, safe space',
 'Come here, let me take care of you... you''ve had a long day.',
 'medium',
 'Inverse of dominance - nurturing power instead of commanding power. Works for soft_sensual, mommy energy.'
);

-- Index for quick lookups
CREATE INDEX idx_parasocial_levers_name ON parasocial_levers(name);
CREATE INDEX idx_parasocial_levers_intensity ON parasocial_levers(intensity);

-- Comments
COMMENT ON TABLE parasocial_levers IS 'Reference table for parasocial lever definitions. Used for validation and documentation. Models can override via voice_profile.parasocial.';
COMMENT ON COLUMN parasocial_levers.intensity IS 'Emotional intensity: low (safe to use often), medium (use thoughtfully), high (use sparingly for impact)';
