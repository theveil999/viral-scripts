-- Initial Schema for Viral Script Generation System
-- Version 1.2 (with archetype_tags instead of single archetype)
--
-- DESIGN PRINCIPLE: Archetypes are optional classification tags for filtering and UI.
-- voice_profile JSONB is the source of truth for script generation.
-- The archetypes table serves as:
--   1. Reference lookup for valid archetype names
--   2. Stores effectiveness patterns for corpus retrieval and batch diversity
--   3. NOT a hard constraint on models

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table: archetypes
-- Reference patterns for model types
-- ============================================
CREATE TABLE archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Patterns that work best for this archetype
    effective_hook_types TEXT[],
    effective_parasocial_levers TEXT[],
    effective_script_archetypes TEXT[],

    -- Voice tendencies
    typical_energy_level TEXT,
    typical_explicitness TEXT,
    common_phrases TEXT[],

    -- Performance data
    avg_performance_score FLOAT,

    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,  -- allows deprecating archetypes without deletion

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: models
-- Model profiles with voice DNA
-- ============================================
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage_name TEXT,

    -- Raw input
    transcript_raw TEXT,
    transcript_summary TEXT,

    -- Extracted voice profile (source of truth for generation)
    voice_profile JSONB NOT NULL,

    -- Classification (optional labels for filtering, NOT generation drivers)
    archetype_tags TEXT[] DEFAULT '{}',  -- e.g., ['chaotic_unhinged', 'southern_belle']
    niche_tags TEXT[] DEFAULT '{}',

    -- Boundaries
    boundaries JSONB,
    explicitness_level TEXT,

    -- Vector for semantic matching
    embedding vector(1536),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: corpus
-- Analyzed viral script examples
-- ============================================
CREATE TABLE corpus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Original content
    content TEXT NOT NULL,
    creator TEXT,
    duration_seconds INTEGER,

    -- Extracted patterns
    hook TEXT,
    hook_type TEXT,
    script_archetype TEXT,
    parasocial_levers TEXT[],
    emotional_arc TEXT,
    niche_tags TEXT[],

    -- Quality
    quality_score FLOAT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Vector
    embedding vector(1536),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: hooks
-- Hook library with freshness tracking
-- ============================================
CREATE TABLE hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    content TEXT NOT NULL,
    hook_type TEXT NOT NULL,

    -- Source tracking
    source TEXT,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    corpus_id UUID REFERENCES corpus(id) ON DELETE SET NULL,

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Performance
    avg_performance_score FLOAT,

    -- Freshness (hooks decay over time)
    freshness_score FLOAT DEFAULT 1.0,

    -- Vector
    embedding vector(1536),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: scripts
-- Generated scripts
-- ============================================
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,
    hook TEXT,

    -- Classification
    hook_type TEXT,
    script_archetype TEXT,
    parasocial_levers TEXT[],

    -- Metadata
    duration_estimate INTEGER,
    word_count INTEGER,

    -- Quality scores
    voice_fidelity_score FLOAT,
    validation_passed BOOLEAN DEFAULT TRUE,

    -- Status tracking
    status TEXT DEFAULT 'draft',

    -- Vector for semantic matching
    embedding vector(1536),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ
);

-- ============================================
-- Table: performance
-- Script performance metrics
-- ============================================
CREATE TABLE performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,

    -- Metrics
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    saves INTEGER,
    shares INTEGER,

    -- Conversion tracking
    estimated_conversions INTEGER,
    conversion_notes TEXT,

    -- Timestamps
    posted_at TIMESTAMPTZ,
    tracked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================

-- Vector search indexes (using ivfflat for approximate nearest neighbor)
CREATE INDEX idx_corpus_embedding ON corpus USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_hooks_embedding ON hooks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_scripts_embedding ON scripts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Array indexes (GIN for fast array containment queries)
CREATE INDEX idx_models_archetype_tags ON models USING GIN (archetype_tags);
CREATE INDEX idx_models_niche_tags ON models USING GIN (niche_tags);
CREATE INDEX idx_corpus_parasocial_levers ON corpus USING GIN (parasocial_levers);
CREATE INDEX idx_corpus_niche_tags ON corpus USING GIN (niche_tags);
CREATE INDEX idx_scripts_parasocial_levers ON scripts USING GIN (parasocial_levers);

-- Foreign key and filter indexes
CREATE INDEX idx_scripts_model_id ON scripts(model_id);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_hooks_model_id ON hooks(model_id);
CREATE INDEX idx_hooks_hook_type ON hooks(hook_type);
CREATE INDEX idx_performance_script_id ON performance(script_id);
CREATE INDEX idx_corpus_hook_type ON corpus(hook_type);
CREATE INDEX idx_corpus_script_archetype ON corpus(script_archetype);
CREATE INDEX idx_corpus_quality_score ON corpus(quality_score);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE models IS 'Model profiles with extracted voice DNA. voice_profile JSONB is the source of truth for script generation.';
COMMENT ON COLUMN models.archetype_tags IS 'Optional labels for quick filtering. Voice_profile JSONB drives generation, not archetypes.';
COMMENT ON TABLE corpus IS 'Analyzed viral script examples used as few-shot examples for generation.';
COMMENT ON TABLE hooks IS 'Hook library with freshness tracking. Hooks decay over time to prevent overuse.';
COMMENT ON TABLE scripts IS 'Generated scripts with quality scores and status tracking.';
COMMENT ON TABLE performance IS 'Script performance metrics for feedback loop optimization.';
COMMENT ON TABLE archetypes IS 'Reference patterns for model classification. Used for corpus retrieval and batch diversity, NOT as hard constraints. Models can have multiple archetype_tags.';
COMMENT ON COLUMN archetypes.is_active IS 'Allows deprecating archetypes without deletion. Inactive archetypes are excluded from new classifications.';
