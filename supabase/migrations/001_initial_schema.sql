-- ============================================================================
-- Viral Script Generation System - Initial Schema
-- ============================================================================
-- PREREQUISITE: Create a Supabase project at supabase.com
-- Get your project URL and anon key from Settings > API
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
-- Enable pgvector for semantic search and similarity matching
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. MODELS TABLE
-- ============================================================================
-- Stores creator profiles with voice characteristics and archetypes
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage_name TEXT,
    transcript_raw TEXT,
    transcript_summary TEXT,
    voice_profile JSONB NOT NULL,
    archetype TEXT NOT NULL CHECK (archetype IN (
        'girl_next_door',
        'bratty_princess',
        'gym_baddie',
        'chaotic_unhinged',
        'soft_dom',
        'spicy_gamer',
        'milf_energy',
        'cottagecore_cutie'
    )),
    archetype_confidence FLOAT,
    niche_tags TEXT[],
    boundaries JSONB, -- Structure: {hard_nos: [], topics_to_avoid: []}
    explicitness_level TEXT CHECK (explicitness_level IN (
        'subtle',
        'medium',
        'full_send'
    )),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SCRIPTS TABLE
-- ============================================================================
-- Generated scripts linked to models with performance tracking
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id),
    content TEXT NOT NULL,
    hook TEXT,
    hook_type TEXT CHECK (hook_type IN (
        'bold_statement',
        'question',
        'challenge',
        'fantasy',
        'relatable',
        'advice',
        'confession',
        'roleplay',
        'storytime',
        'hot_take'
    )),
    script_archetype TEXT CHECK (script_archetype IN (
        'thirst_commentary',
        'fantasy_desire',
        'chain_game',
        'praise_dynamic',
        'confession',
        'advice_tip',
        'relatable_rant',
        'roleplay'
    )),
    parasocial_levers TEXT[],
    duration_estimate INTEGER,
    word_count INTEGER,
    voice_fidelity_score FLOAT,
    validation_passed BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft',
        'sent',
        'posted',
        'tracked'
    )),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ
);

-- ============================================================================
-- 4. CORPUS TABLE
-- ============================================================================
-- Reference library of high-performing scripts for RAG retrieval
CREATE TABLE corpus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    creator TEXT,
    duration_seconds INTEGER,
    hook TEXT,
    hook_type TEXT,
    script_archetype TEXT,
    parasocial_levers TEXT[],
    emotional_arc TEXT,
    niche_tags TEXT[],
    quality_score FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. HOOKS TABLE
-- ============================================================================
-- Reusable hooks with freshness tracking and performance metrics
CREATE TABLE hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    hook_type TEXT NOT NULL,
    source TEXT CHECK (source IN (
        'corpus',
        'generated',
        'model_specific'
    )),
    model_id UUID REFERENCES models(id),
    corpus_id UUID REFERENCES corpus(id),
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    avg_performance_score FLOAT,
    freshness_score FLOAT DEFAULT 1.0,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. PERFORMANCE TABLE
-- ============================================================================
-- Tracks engagement metrics for posted scripts
CREATE TABLE performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id),
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    saves INTEGER,
    shares INTEGER,
    estimated_conversions INTEGER,
    conversion_notes TEXT,
    posted_at TIMESTAMPTZ,
    tracked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. ARCHETYPES TABLE
-- ============================================================================
-- Configuration and performance data for each archetype
CREATE TABLE archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    effective_hook_types TEXT[],
    effective_parasocial_levers TEXT[],
    effective_script_archetypes TEXT[],
    typical_energy_level TEXT,
    typical_explicitness TEXT,
    common_phrases TEXT[],
    avg_performance_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PERFORMANCE INDEXES
-- ============================================================================
-- Vector similarity search indexes (IVFFlat for approximate nearest neighbor)
CREATE INDEX idx_corpus_embedding ON corpus USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_scripts_embedding ON scripts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_hooks_embedding ON hooks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Foreign key and lookup indexes
CREATE INDEX idx_scripts_model_id ON scripts(model_id);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_hooks_model_id ON hooks(model_id);
CREATE INDEX idx_hooks_hook_type ON hooks(hook_type);
CREATE INDEX idx_performance_script_id ON performance(script_id);
CREATE INDEX idx_corpus_hook_type ON corpus(hook_type);
CREATE INDEX idx_corpus_script_archetype ON corpus(script_archetype);

-- ============================================================================
-- 9. UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update the updated_at timestamp on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to models table
CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to archetypes table
CREATE TRIGGER update_archetypes_updated_at
    BEFORE UPDATE ON archetypes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
