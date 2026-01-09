# Viral Script Generation System
## Master Specification Document
### Version 1.0 | January 4, 2026

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Goals & Success Metrics](#2-system-goals--success-metrics)
3. [User Workflows](#3-user-workflows)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Schema](#5-database-schema)
6. [AI Pipeline](#6-ai-pipeline)
7. [Model Profile Extraction Schema](#7-model-profile-extraction-schema)
8. [Corpus Taxonomy](#8-corpus-taxonomy)
9. [Parasocial Lever Framework](#9-parasocial-lever-framework)
10. [Hook Point & Virality Frameworks](#10-hook-point--virality-frameworks)
11. [Anti-AI-Tell Rules](#11-anti-ai-tell-rules)
12. [Voice Fidelity Requirements](#12-voice-fidelity-requirements)
13. [Build Phases](#13-build-phases)
14. [Future Enhancements](#14-future-enhancements)

---

# 1. Executive Summary

## What This System Does

A viral content script generation system for OnlyFans models that:
- Ingests a recorded interview call with a model
- Extracts her complete "linguistic DNA" (voice patterns, personality, niche, boundaries)
- Generates batch scripts (21+ at a time) for Instagram Reels talking-head videos
- Produces scripts that sound indistinguishable from how the model actually speaks
- Learns over time which patterns convert best for each model
- Requires minimal effort: click, generate, copy, send

## The Core Problem Being Solved

Instagram Reels serve as a funnel: Reels → Parasocial Attachment → Profile Visit → OnlyFans Subscription.

The system must produce scripts that:
1. Capture attention in the first 3 seconds (Hook Point framework)
2. Build parasocial connection (psychological triggers)
3. Sound authentically like the specific model (voice fidelity)
4. Convert viewers into obsessed followers who subscribe

## Critical Success Factor

**Voice fidelity is everything.** If scripts sound AI-generated, they fail. The model should be able to read a generated script and deliver it naturally without rewriting. It should feel like something she would actually say.

---

# 2. System Goals & Success Metrics

## Primary Goals

1. **Script Generation Speed**: Generate 25 scripts in under 90 seconds
2. **Voice Fidelity**: Scripts match model's speech patterns so closely she can deliver without editing
3. **Viral Patterns**: Every script follows proven viral structures from 650+ corpus examples
4. **Conversion Optimization**: Learn which patterns convert best per model over time
5. **Minimal Friction**: Click model → set count → generate → copy → send

## Success Metrics

| Metric | Target |
|--------|--------|
| Scripts per batch | 21-30 (one week of 3x daily posting) |
| Voice fidelity score | >85/100 on validation |
| AI-tell detection | 0 flagged patterns per script |
| Time to generate batch | <90 seconds |
| Script rejection rate | <10% (pass validation first try) |
| Model edit rate | <5% of scripts need changes |

---

# 3. User Workflows

## Workflow 1: Model Onboarding

```
Record interview call on Google Meet (45-60 min using interview guide)
    ↓
Google Meet auto-generates transcript
    ↓
Copy/paste transcript into dashboard (or upload .txt/.vtt)
    ↓
Claude extracts voice profile automatically
    ↓
Review profile in dashboard (edit if needed)
    ↓
Optional: Add archetype tags for filtering
    ↓
Model ready for script generation
```

**Time: ~5 minutes of manual work after call**

## Workflow 2: Script Generation

```
Open dashboard
    ↓
Select model from list
    ↓
Set number of scripts (slider: 1-30)
    ↓
Optional: Set preferences (archetype mix, duration targets)
    ↓
Click "Generate"
    ↓
Wait ~60-90 seconds
    ↓
Scripts appear in list
    ↓
Copy each script → Send to model (paste in Notion/message)
    ↓
Mark as "Sent"
```

**Time: 2-3 minutes per batch**

## Workflow 3: Performance Tracking

```
Model posts scripts as Reels
    ↓
Weekly: Input performance data
    - Which scripts were posted
    - Views, engagement, saves, shares
    - Any conversion spikes noticed
    ↓
System updates pattern scoring
    ↓
Future generations biased toward what works
```

**Time: 10-15 minutes weekly per model**

---

# 4. Technical Architecture

## Stack Overview

| Layer | Technology | Why |
|-------|------------|-----|
| Database | Supabase (PostgreSQL + pgvector) | Complex queries, vector search for semantic matching, free tier generous |
| Orchestration | n8n | Visual workflows, AI integrations, webhook triggers, you know it |
| Frontend | Next.js (custom dashboard) | Exact UX needed, Claude Code can scaffold, free hosting on Vercel |
| AI Models | Claude API (Sonnet/Opus) | Best for voice matching and creative generation |
| Transcription | Google Meet (built-in) | Free, already in use. Upgrade to Deepgram later if filler preservation insufficient |
| Hosting | Vercel (frontend), Supabase (backend), n8n Cloud or self-hosted | |

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOU (Dashboard)                         │
│  - Upload transcript / paste                                    │
│  - Review model profiles                                        │
│  - Generate scripts (select model, set count)                   │
│  - Copy scripts                                                 │
│  - Input performance data                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                         │
│                                                                 │
│  Screens:                                                       │
│  - Models List (card view, quick stats)                         │
│  - Model Detail (profile, generate panel, scripts list)         │
│  - Script View (content, copy, tags, status, performance)       │
│  - Corpus Browser (search viral examples)                       │
│  - Analytics (performance insights)                             │
│                                                                 │
│  Hosted on Vercel                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    n8n (Orchestration Layer)                    │
│                                                                 │
│  Workflows:                                                     │
│  1. Transcript Intake → Deepgram → Profile Extraction → DB      │
│  2. Script Generation (6-stage pipeline) → DB                   │
│  3. Corpus Processing (one-time) → Pattern extraction → DB      │
│  4. Performance Sync (scheduled) → Update metrics               │
│  5. Weekly Insights → Recommendations                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE (Database + Vector Search)                │
│                                                                 │
│  Tables:                                                        │
│  - models (profiles, voice DNA, archetype, embeddings)          │
│  - scripts (generated content, tags, status, embeddings)        │
│  - corpus (analyzed viral patterns, embeddings)                 │
│  - hooks (library with freshness tracking)                      │
│  - performance (script → metrics)                               │
│  - archetypes (pattern templates per model type)                │
│                                                                 │
│  Features: pgvector for semantic search                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI LAYER (Claude API)                     │
│                                                                 │
│  Used for:                                                      │
│  - Profile extraction from transcripts                          │
│  - Hook generation                                              │
│  - Script expansion                                             │
│  - Voice transformation                                         │
│  - Validation and scoring                                       │
│  - Corpus analysis (one-time)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. Database Schema

## Table: models

```sql
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage_name TEXT,
    
    -- Raw input
    transcript_raw TEXT,
    transcript_summary TEXT,
    
    -- Extracted voice profile (see section 7 for full schema)
    voice_profile JSONB NOT NULL,
    
    -- Classification (optional labels for filtering, NOT generation drivers)
    archetype_tags TEXT[],  -- e.g., ['chaotic_unhinged', 'gym_baddie']
    niche_tags TEXT[],
    
    -- Boundaries
    boundaries JSONB,  -- {hard_nos: [], topics_to_avoid: []}
    explicitness_level TEXT,  -- subtle, medium, full_send
    
    -- Vector for semantic matching
    embedding vector(1536),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Table: scripts

```sql
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id),
    
    -- Content
    content TEXT NOT NULL,
    hook TEXT,  -- First 1-3 sentences extracted
    
    -- Classification
    hook_type TEXT,  -- confession, fantasy, hot_take, etc.
    script_archetype TEXT,  -- storytime, rant, confession, etc.
    parasocial_levers TEXT[],
    
    -- Metadata
    duration_estimate INTEGER,  -- seconds
    word_count INTEGER,
    
    -- Quality scores
    voice_fidelity_score FLOAT,
    validation_passed BOOLEAN DEFAULT TRUE,
    
    -- Status tracking
    status TEXT DEFAULT 'draft',  -- draft, sent, posted, tracked
    
    -- Vector for semantic matching
    embedding vector(1536),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ
);
```

## Table: corpus

```sql
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
    emotional_arc TEXT,  -- e.g., "vulnerable_to_confident"
    niche_tags TEXT[],
    
    -- Quality
    quality_score FLOAT,  -- 0-1, filtered during import
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Vector
    embedding vector(1536),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Table: hooks

```sql
CREATE TABLE hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    content TEXT NOT NULL,
    hook_type TEXT NOT NULL,
    
    -- Source tracking
    source TEXT,  -- corpus, generated, model_specific
    model_id UUID REFERENCES models(id),  -- NULL if universal
    corpus_id UUID REFERENCES corpus(id),  -- if extracted from corpus
    
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
```

## Table: performance

```sql
CREATE TABLE performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id),
    
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
```

## Table: archetypes

```sql
CREATE TABLE archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT UNIQUE NOT NULL,  -- girl_next_door, bratty_princess, etc.
    description TEXT,
    
    -- Patterns that work best for this archetype
    effective_hook_types TEXT[],
    effective_parasocial_levers TEXT[],
    effective_script_archetypes TEXT[],
    
    -- Voice tendencies
    typical_energy_level TEXT,  -- high, medium, low
    typical_explicitness TEXT,
    common_phrases TEXT[],
    
    -- Performance data
    avg_performance_score FLOAT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 6. AI Pipeline

## Overview

Script generation uses a 6-stage pipeline where each stage is optimized for one specific task. This separation of concerns dramatically improves output quality compared to a single mega-prompt.

## Stage 1: Corpus Retrieval

**Purpose:** Find the most relevant viral examples to guide generation

**Input:**
- Model profile (archetype, niche, voice patterns)
- Requested script count
- Optional: specific archetype preferences

**Process:**
```
1. Vector search corpus for scripts similar to model's embedding
2. Filter by matching archetypes and niches
3. Ensure diversity (not all same hook_type)
4. Select 10-15 highest-quality matches
```

**Output:** Array of corpus scripts to use as few-shot examples

**No LLM call — pure database query with vector search**

---

## Stage 2: Hook Generation

**Purpose:** Generate compelling opening hooks for each script

**Input:**
- Model profile
- Corpus examples from Stage 1
- Existing hook bank (model-specific + universal)
- Number of scripts requested

**Prompt Requirements:**
```
- Hook Point framework rules (3-second capture)
- Must match model's voice patterns
- Diversity across hook types
- No AI-tell phrases
- Inject model's sentence starters and filler words
```

**Output:** 30 hook candidates (generate more than needed, select best)

Each hook tagged with:
- hook_type (confession, fantasy, hot_take, question, advice, storytime, challenge)
- estimated emotional tone

**Model:** Claude Sonnet (balance of speed and quality)

---

## Stage 3: Script Expansion

**Purpose:** Expand each selected hook into a complete script

**Input:**
- Selected hooks from Stage 2 (top 25)
- Corpus examples with matching script archetypes
- Structure templates per archetype

**Prompt Requirements:**
```
- Follow fairy tale structure (setup → tension → resolution)
- Include parasocial lever requirements (min 2 per script)
- Target duration (10-18 seconds optimal)
- CTA variation (not same CTA every script)
- Match emotional arc patterns from corpus
```

**Output:** Complete script drafts with structure annotations

Each script tagged with:
- script_archetype
- parasocial_levers used
- duration_estimate
- cta_type

**Model:** Claude Sonnet

---

## Stage 4: Voice Transformation

**Purpose:** Rewrite each script in the model's exact voice

**This is the most critical stage for quality.**

**Input:**
- Expanded scripts from Stage 3
- Model's complete voice profile
- Examples of model's actual speech (from transcript)

**Prompt Requirements:**
```
INJECT:
- Her filler words at natural frequency
- Her sentence starters ("okay so", "like", "honestly")
- Her catchphrases and CTAs
- Her euphemisms and slang
- Her self-interruption patterns
- Her emphasis style (stretched words, repetition)

MATCH:
- Her average sentence length
- Her energy level
- Her explicitness level
- Her rhetorical question frequency
- Her swearing cadence

TRANSFORM:
- Perfect grammar → natural speech with fragments
- Formal vocabulary → her casual vocabulary
- Clean structure → her messy, authentic flow
```

**Output:** Voice-matched scripts ready for validation

**Model:** Claude Opus (highest quality for voice matching)

---

## Stage 5: Validation

**Purpose:** Score scripts and filter out failures

**Input:**
- Voice-transformed scripts from Stage 4
- Validation rules (see sections 11-12)

**Checks Performed:**

| Check | Requirement | Action if Failed |
|-------|-------------|------------------|
| AI-tell scan | 0 banned phrases | Regenerate |
| Voice fidelity score | >85/100 | Regenerate |
| Hook presence | Hook in first 3 seconds | Flag |
| Parasocial levers | Min 2 tagged | Flag |
| Duration estimate | Within target range | Flag |
| Batch diversity | Varied hook types, archetypes | Swap scripts |
| Boundary compliance | Nothing in model's off-limits | Reject |

**Output:** 
- Approved scripts → proceed to Stage 6
- Failed scripts → regenerate (up to 2 retries) or flag for review

**Model:** Claude Haiku (fast, cheap for validation)

---

## Stage 6: Output

**Purpose:** Finalize and store scripts

**Process:**
```
1. Write approved scripts to database
2. Generate embeddings for future retrieval
3. Update hook usage tracking
4. Apply batch diversity enforcement
5. Return to dashboard
```

**Batch Diversity Enforcement:**
- No more than 3 scripts of same archetype
- All 5 viral themes represented at least once
- At least 4 different hook types
- Parasocial levers distributed (not all vulnerability, not all direct address)
- CTA types varied
- Duration targets varied

**Output:** Script IDs + content returned to dashboard

---

# 7. Model Profile Extraction Schema

## Complete Voice Profile JSON Structure

```json
{
  "identity": {
    "name": "string",
    "stage_name": "string",
    "nicknames_fans_use": ["string"],
    "origin_location": "string",
    "age_range": "string",
    "quick_bio": "string"
  },
  
  "voice_mechanics": {
    "filler_words": [
      {"word": "like", "frequency": "high"},
      {"word": "literally", "frequency": "medium"},
      {"word": "honestly", "frequency": "medium"}
    ],
    "sentence_starters": ["okay so", "like", "honestly", "I mean"],
    "avg_sentence_length": "medium",  // short, medium, long
    "sentence_style": "run-on",  // fragmented, complete, run-on
    "question_frequency": "high",
    "self_interruption_patterns": ["wait no", "actually", "hold on"],
    "swear_words": ["fuck", "shit"],
    "swear_frequency": "high",
    "catchphrases": ["follow me I miss you", "god forbid a girl..."],
    "cta_style": "follow me I miss you",
    "emphasis_style": {
      "uses_caps": false,
      "stretches_words": true,  // "sooo", "literallyyyy"
      "uses_repetition": true   // "so, so good"
    },
    "text_style": {
      "lowercase_preference": true,
      "emoji_usage": "minimal",
      "abbreviations": ["rn", "ngl", "tbh"]
    }
  },
  
  "personality": {
    "self_described_traits": ["chaotic", "unhinged", "horny"],
    "friend_described_traits": ["funny", "loud", "honest"],
    "humor_style": "roaster",  // roaster, hype_girl, both
    "energy_level": "high",  // high, medium, low
    "toxic_trait": "string - what she admits to",
    "hot_takes": ["string - opinions she's stated"]
  },
  
  "content": {
    "niche_topics": ["dating", "relationships", "sex tips"],
    "can_talk_hours_about": ["string"],
    "content_types": ["talking to camera", "storytime", "advice"],
    "differentiator": "string - what makes her different",
    "strong_opinions_on": ["string"],
    "trends_she_hates": ["string"]
  },
  
  "audience": {
    "target_viewer_description": "string",
    "fantasy_fulfilled": "bratty_princess",  // archetype
    "how_fans_talk_to_her": "string - DM patterns",
    "best_performing_content": "string"
  },
  
  "spicy": {
    "explicitness_level": "medium",  // subtle, medium, full_send
    "flirting_style": "string",
    "turn_ons_discussed": ["string"],
    "her_type": "string"
  },
  
  "boundaries": {
    "hard_nos": ["string - absolutely won't do"],
    "topics_to_avoid": ["string"]
  },
  
  "aesthetic": {
    "visual_style": "string",
    "colors_vibes": "string",
    "content_energy": "string"
  },

  "parasocial": {
    "strengths": ["confession", "vulnerability", "direct_address"],  // levers she excels at
    "avoid": ["dominance"]  // levers that don't fit her
  },

  "archetype_assignment": {
    "primary": "bratty_princess",
    "secondary": "chaotic_unhinged",
    "confidence": 0.85
  },
  
  "sample_speech": [
    "Verbatim quote from transcript showing her natural voice",
    "Another example quote",
    "Third example quote"
  ]
}
```

## Archetype Definitions

| Archetype | Description | Voice Tendencies | Effective Levers |
|-----------|-------------|------------------|------------------|
| **girl_next_door** | Approachable, relatable, sweet with a naughty side | Softer language, more "cute" expressions, rhetorical questions | Relatability, vulnerability, direct address |
| **bratty_princess** | Demanding, playful, knows what she wants | Commands, challenges, "I want", "I need" | Challenge, exclusivity, sexual tension |
| **gym_baddie** | Fitness-focused, confident, body-positive | Fitness metaphors, confident assertions, competitive | Aspiration, challenge, sexual tension |
| **alt_egirl** | Alternative aesthetic, edgy, mysterious | Darker humor, niche references, self-deprecating | Vulnerability, confession, inside references |
| **classy_mysterious** | Sophisticated, teasing, less explicit | Innuendo over explicit, suggestive, refined vocabulary | Sexual tension, exclusivity, aspiration |
| **party_girl** | High energy, fun, social, wild stories | Exclamations, stories, "one time...", chaotic energy | Confession, storytime hooks, vulnerability |
| **nerdy_gamer_girl** | Gamer/nerd culture, relatable, playful | Gaming references, pop culture, self-aware humor | Relatability, inside references, direct address |
| **spicy_latina** | Passionate, fiery, expressive | Spanish phrases, passionate declarations, sensual | Sexual tension, challenge, vulnerability |
| **southern_belle** | Sweet with edge, charming, country elements | Southern phrases, hospitality flipped naughty | Relatability, confession, vulnerability |
| **cool_girl** | Into cars, sports, "one of the guys" vibe | Guy-friendly topics, casual confidence, bro energy | Relatability, inside references, challenge |
| **chaotic_unhinged** | Unpredictable, wild, no filter | Stream of consciousness, tangents, "I need help" | Confession, vulnerability, relatability |
| **soft_sensual** | Slow, intimate, ASMR-adjacent | Softer pacing, intimate language, descriptive | Sexual tension, direct address, vulnerability |
| **dominant** | In control, commanding, powerful | Commands, power language, "you will" | Challenge, exclusivity, sexual tension |
| **submissive** | Wanting to please, responsive | "I want you to", receiving language, eager | Vulnerability, direct address, confession |

---

# 8. Corpus Taxonomy

## Hook Types

| Hook Type | Pattern | Example | Corpus % |
|-----------|---------|---------|----------|
| **bold_statement** | Strong declarative opening | "Nothing is hotter than...", "The hottest thing..." | 78% |
| **question** | Direct question to audience | "Do you ever...", "Did you know..." | 11% |
| **challenge** | Provocative/conditional opener | "If your girl doesn't...", "This is what the first letter..." | 3% |
| **fantasy** | Describing desired scenario | "I want a man who...", "I need a man..." | 2% |
| **relatable** | Shared experience observation | "Love when...", "I'm the type of girlfriend..." | 2% |
| **advice** | Giving guidance | "The key to...", "Do not date a man who..." | 1% |
| **confession** | Admitting something personal/taboo | "My toxic trait is...", "I'm not ashamed to admit..." | 1% |
| **roleplay** | Character/scenario opening | "Hello my sweet boy...", "Come here...", "Excuse me sir..." | 1% |
| **storytime** | Narrative opener | "Random storytime but...", "A few years ago..." | <1% |
| **hot_take** | Controversial opinion | "Unpopular opinion but...", "I don't care what people say..." | <1% |

## Script Archetypes

| Archetype | Description | Structure | Duration | Corpus % |
|-----------|-------------|-----------|----------|----------|
| **thirst_commentary** | Reacting to male behavior/attributes | Observation → Reaction → Escalate desire → Playful close | 10-14s | 71% |
| **fantasy_desire** | Describing ideal scenario or partner | Hook → Build desire → Intensify → Soft CTA | 12-16s | 21% |
| **chain_game** | "Send this to...", letter/name games | Setup game → Condition → Payoff → Share CTA | 6-10s | 4% |
| **praise_dynamic** | Good boy/girl, dominant energy | Address → Command/praise → Reward/tease | 6-12s | 1% |
| **confession** | Admitting something personal/taboo | Hook → Confession → Reaction → Normalize | 10-15s | 1% |
| **advice_tip** | Giving guidance to audience | Hook → Tip → Why it works → CTA | 12-18s | 1% |
| **relatable_rant** | Shared frustration or observation | Hook → Frustration → Escalate → Commiserate | 12-18s | <1% |
| **roleplay** | Character scenario (doctor, trainer, etc.) | Enter scene → Build → Punchline | 8-15s | <1% |
| **storytime** | Personal anecdote with narrative arc | Hook → Setup → Event → Punchline | 15-25s | <1% |
| **relationship_dynamic** | Commentary on relationship dynamics | Hook → Dynamic → Why it's hot → CTA | 12-16s | <1% |

## CTA Types

| CTA Type | Example | When to Use |
|----------|---------|-------------|
| **follow** | "follow me, I miss you" | Default for growth |
| **engagement** | "comment if you agree", "tell me I'm not crazy" | When seeking interaction |
| **profile_link** | "link in bio if you want more" | Soft OF push |
| **dm_bait** | "DM me your answer" | Building direct connection |
| **save_share** | "save this for later" | Evergreen content |
| **none** | No explicit CTA | Pure value content (80/20 rule) |

## Duration Buckets

| Bucket | Seconds | Best For |
|--------|---------|----------|
| **micro** | 8-12s | Hot takes, single jokes, quick confessions |
| **short** | 12-18s | Most content - fantasies, tips, observations |
| **medium** | 18-25s | Storytimes, detailed advice, rants |
| **long** | 25-40s | Complex stories, multiple points, updates |

**Optimal target: 12-18 seconds (short bucket)**

---

# 9. Parasocial Lever Framework

## Core Levers

| Lever | Description | Implementation | Example |
|-------|-------------|----------------|---------|
| **direct_address** | Speaking directly to "you", making it personal | Second person throughout, "you" in first 3 seconds | "I need to tell you something..." |
| **sexual_tension** | Suggestive without explicit, building desire | Implication, teasing, explicit references | "back shots", "pink taco", "moan" |
| **relatability** | Shared common experience | "Do you ever", "Have you ever", "Ladies" | "Why do guys always..." |
| **vulnerability** | Sharing something personal, uncomfortable, real | Admissions, embarrassments, insecurities | "I've never told anyone this but..." |
| **confession** | Admitting something taboo or surprising | "My toxic trait", "I'm not ashamed to admit" | "Okay I have to be honest..." |
| **exclusivity** | Making viewer feel special, insider | "Only my real ones", "Send this to", "BTS" | "I don't tell everyone this..." |
| **challenge** | Provocative, creating intrigue | "If your", "If he doesn't", "If she" | "Most guys couldn't handle..." |
| **praise** | Good boy/girl dynamics, rewarding viewer | "Good boy", "Good girl", affirmation | "You've been such a good boy..." |
| **dominance** | Commanding energy, power dynamic | "Listen to", "Repeat after me", "Obedience" | "It's time for obedience training..." |
| **playful_self_deprecation** | Humanizing through gentle self-mockery | "I need help", "I'm evil", "Red flag" | "There's something wrong with me..." |
| **inside_reference** | Callbacks that reward loyal viewers | References to previous content, running jokes | "You know how I always say..." |
| **aspiration** | Glimpse of desirable lifestyle | Casual mentions of lifestyle, experiences | "So I just got back from..." |

## Lever Combinations That Work

| Combination | Effect | When to Use |
|-------------|--------|-------------|
| vulnerability + direct_address | Creates intimate confession feel | Deeper parasocial building |
| sexual_tension + challenge | Creates intrigue and desire | Thirst content |
| relatability + confession | Makes taboo feel normal | Normalizing desires |
| exclusivity + inside_reference | Rewards loyal viewers | Building community |
| playful_self_deprecation + vulnerability | Humanizes while connecting | Authentic moments |

## Rules

1. Every script must have at least 2 levers
2. direct_address should appear in 80%+ of scripts
3. vulnerability and confession are highest-engagement but use sparingly (30-40% of batch)
4. Vary levers across batch to prevent fatigue

---

# 10. Hook Point & Virality Frameworks

## From Hook Point by Brendan Kane

### The 3-Second Rule
- You have 3 seconds to capture attention
- The hook must be graspable instantly
- If they have to think too hard, you lose them

### Five-Step Hook Creation Process
1. Study successful hooks in your space
2. Study successful hooks OUTSIDE your space
3. Brainstorm hooks (quantity over quality initially)
4. Compare your hooks to proven winners
5. Test, reiterate, repeat

### "You Know How..." Framework
Test any hook by framing as: "You know how [common experience]?"
If people nod yes = resonance. Perfect for relatable content.

### The Fairy Tale Structure
```
Once upon a time → everything was fine
Then → dragon appeared (problem/conflict)
Hero arrived → solution/insight/transformation
Happily ever after → resolution/CTA
```

Even 30-second scripts can follow this arc.

### Brand Is Not The Hero
The MODEL is not the hero — the VIEWER is.
She's the guide, the relatable friend, the one who "gets it."
This flips parasocial dynamics correctly.

### Hook Fatigue
Hooks decay. When copied or overused, they die.
System must track freshness and rotate.

### Attention Types
Getting attention isn't enough — must be RIGHT attention.
Hooks must align with the emotional response you want.

## From 1 Million Followers

### Five Viral Themes (Jay Shetty / Shareability)
Content gets shared when it makes people FEEL:
1. **Adventure** — exciting, aspirational
2. **Comedy** — funny, amusing
3. **Emotion** — touching, moving
4. **Inspiration** — motivating, uplifting
5. **Surprise** — unexpected, shocking

**Every script should hit at least one.**

### The 80/20 Value Rule
- 80% of content = pure value (entertainment, emotion, relatability)
- 20% of content = CTA / ask

Don't push OF in every video. The funnel is:
Entertainment → Parasocial attachment → Curiosity → Profile → OF link

### Emotional Response = Shareability
People share content that makes them FEEL something.
Not information — emotion.

### Jay Shetty's Three Reasons for Virality
1. Concepts from real-life experience (authenticity)
2. Scientific studies or credible backing (authority)
3. Poetic, simplistic language (memorability)

For OF content, translate to:
1. Real personal experiences and desires
2. "Every girl knows..." social proof
3. Memorable phrases, quotable lines

---

# 11. Anti-AI-Tell Rules

## Banned Phrases (Hard Filter)

The following patterns IMMEDIATELY flag a script as AI-generated. Never use:

### Transition Words
- "Furthermore"
- "Additionally"
- "Moreover"
- "However" (at start of sentence)
- "Nevertheless"
- "Consequently"
- "Thus"
- "Hence"

### Formal Structures
- "On one hand... on the other hand"
- "It's important to note that"
- "One could argue that"
- "It should be mentioned"
- "In conclusion"
- "To summarize"
- "First... Second... Third..."

### Generic AI Phrases
- "I really enjoy spending time with..."
- "As someone who..."
- "I find it fascinating that..."
- "It's worth noting"
- "Interestingly enough"
- "That being said"
- "At the end of the day" (without being casual)
- "In today's world"
- "Many people don't realize"

### Overly Balanced Statements
- "While X is true, Y is also important"
- "There are pros and cons to consider"
- "Both sides have valid points"

### Perfect List Structures
- Bullet points in spoken content
- Numbered items in casual speech
- "Here are three reasons why..."

## Patterns to Avoid

| AI Pattern | Why It's Bad | Human Alternative |
|------------|--------------|-------------------|
| Perfect grammar | Nobody speaks in perfect sentences | Fragments, run-ons, trailing off |
| Complete thoughts every time | Too clean | Thoughts that restart, get interrupted |
| Formal vocabulary | Stiff, unnatural | Casual, slang, her words |
| Perfect structure | Intro-body-conclusion is obvious | Messy starts, tangents, loops back |
| Generic phrases | Could apply to anyone | Specific details from HER life |
| Balanced hedging | Real people have opinions | Strong takes, even exaggerated |
| Smooth transitions | Feels written | Abrupt shifts, "okay but", "anyway" |

## Validation Check

Before output, scan for:
1. Any banned phrase = REJECT
2. Sentences all same length = FLAG
3. No filler words = FLAG
4. Perfect paragraph structure = FLAG
5. >3 sentences without fragment = FLAG

---

# 12. Voice Fidelity Requirements

## Scoring Criteria (0-100)

| Criterion | Weight | How to Score |
|-----------|--------|--------------|
| Filler word presence | 20% | Are her fillers injected at natural frequency? |
| Sentence starter match | 15% | Does she start sentences her way? |
| Vocabulary match | 20% | Are 80%+ words in her typical vocabulary? |
| Sentence length distribution | 15% | Does it match her rhythm? |
| Catchphrase/CTA inclusion | 10% | Are her phrases present? |
| Energy level match | 10% | Does it feel like her energy? |
| Swearing calibration | 5% | Right words, right frequency? |
| No AI tells | 5% | Clean of banned patterns? |

**Threshold: 85/100 to pass**

## Transformation Requirements

### MUST Include:
- Her filler words at natural density
- Her sentence starters
- At least one catchphrase per 3 scripts
- Her self-interruption patterns (if she has them)
- Her emphasis style

### MUST Match:
- Her average sentence length (±20%)
- Her fragment-to-complete ratio
- Her question frequency
- Her energy level
- Her explicitness level

### MUST Avoid:
- Vocabulary she wouldn't use
- Sentence structures unlike hers
- Energy level mismatch
- Explicitness beyond her comfort
- Topics in her boundaries

## "Messy Draft" Principle

Scripts should feel like a FIRST DRAFT of what she'd say — slightly messy, authentic, imperfect.

Real speech has:
- False starts ("I was gonna— actually no")
- Backtracking ("wait, hold on")
- Filler at natural points
- Emphasis through repetition ("so, so good")
- Implied context
- Emotional leakage (script implies laughing, sighing, trailing off)

Better too raw than too polished.

---

# 13. Build Phases

## Phase 1: Foundation (Week 1)

### 1.1 Database Setup
- Create Supabase project
- Implement all tables from schema
- Enable pgvector extension
- Set up Row Level Security (optional for now)

### 1.2 Corpus Processing
- Clean corpus CSV (remove junk entries)
- Run through Claude to extract:
  - hook
  - hook_type
  - script_archetype
  - parasocial_levers
  - quality_score
- Generate embeddings for each
- Insert into corpus table

### 1.3 Basic n8n Setup
- Create n8n workspace
- Set up Supabase connection
- Set up Claude API connection
- Create basic webhook endpoints

**Deliverable:** Database populated with analyzed corpus, n8n connected

---

## Phase 2: Profile Extraction

### 2.1 Transcript Intake
- Dashboard accepts paste or file upload (.txt, .vtt)
- Store raw transcript in models.transcript_raw
- No external transcription service needed (Google Meet handles it)

### 2.2 Profile Extraction Pipeline
- Build Claude prompt for profile extraction
- Create n8n workflow: transcript → Claude → structured profile
- Test extraction quality
- Iterate on prompt until profiles are comprehensive

### 2.3 Archetype Classification
- Build archetype assignment logic
- Test across different model types
- Create archetype table with effectiveness patterns

**Deliverable:** Can intake a transcript and produce complete model profile

---

## Phase 3: Script Generation Pipeline (Week 3)

### 3.1 Stage 1-2: Retrieval + Hooks
- Implement vector search for corpus retrieval
- Build hook generation prompt
- Test hook quality and diversity

### 3.2 Stage 3-4: Expansion + Voice Transform
- Build script expansion prompt with archetype templates
- Build voice transformation prompt (CRITICAL - iterate heavily)
- Test voice fidelity across different model profiles

### 3.3 Stage 5-6: Validation + Output
- Implement validation checks
- Build rejection/regeneration logic
- Create output formatting

### 3.4 Full Pipeline Integration
- Connect all stages in n8n
- Test end-to-end generation
- Optimize for speed (<90 seconds target)

**Deliverable:** Can generate voice-matched scripts via n8n webhook

---

## Phase 4: Dashboard (Week 4)

### 4.1 Scaffold Next.js App
- Create Next.js project
- Set up Supabase client
- Create basic routing

### 4.2 Models Screen
- Model list view with cards
- Add new model flow (upload/paste transcript)
- Model detail view with profile display

### 4.3 Script Generation Screen
- Model selector
- Script count input
- Generate button → webhook trigger
- Loading state
- Script list display

### 4.4 Script Management
- Copy button for each script
- Status toggles (draft → sent → posted)
- Regenerate single script option

**Deliverable:** Functional dashboard for full workflow

---

## Phase 5: Performance Tracking (Week 5)

### 5.1 Performance Input
- Add performance input form per script
- Create performance table views

### 5.2 Basic Analytics
- Performance by model view
- Performance by script archetype
- Simple insights

### 5.3 Feedback Integration
- Update corpus with high-performing generated scripts
- Adjust pattern weights based on performance

**Deliverable:** Full system with learning capability

---

## Phase 6: Polish (Week 6)

### 6.1 UX Improvements
- Loading states
- Error handling
- Mobile responsiveness

### 6.2 Prompt Optimization
- Review generated script quality
- Iterate on prompts based on output
- Optimize voice fidelity

### 6.3 Documentation
- Usage guide
- Troubleshooting

**Deliverable:** Production-ready system

---

# 14. Future Enhancements

## Priority 1 (After Launch)

### Trend Injection Layer
- Scrape top-performing reels from similar creators
- Extract trending hooks/formats
- Surface in dashboard as "trending now"
- Optional integration into generation

### A/B Test Framework
- Generate 2-3 variations of same hook
- Track which performs best
- Feed back into hook scoring

### Content Calendar Logic
- Sequence suggestions based on parasocial arc
- Week 1: Relatability (low barrier)
- Week 2: Vulnerability (deepen)
- Week 3: Exclusivity (make special)
- Week 4: Spicy + CTA (convert)

## Priority 2 (Growth)

### Instagram API Integration
- Auto-pull metrics for posted reels
- Match to scripts automatically
- Fully automated feedback loop

### Model Self-Service Portal
- Models log in and see their scripts
- Mark scripts as "filmed" / "posted"
- Basic analytics visible to them

### Batch Scheduling
- Schedule generation for multiple models
- Weekly auto-generation with notification

## Priority 3 (Scale)

### Multi-User Support
- Team member accounts
- Role-based permissions
- Audit logging

### Advanced Analytics
- Cohort analysis
- Conversion funnel visualization
- Predictive performance scoring

### Productization
- Onboarding flow for external agencies
- Billing integration
- White-label option

---

# Appendix A: Interview Guide Reference

The complete interview guide is maintained separately. Key sections:

1. **Warm-Up & Identity** (5 min) — Name, quick bio, vibe
2. **Voice Capture** (10-15 min) — ⭐ MOST IMPORTANT
   - 2-minute ramble (pure voice capture)
   - Filler words identification
   - Swearing patterns
   - Catchphrases and CTAs
   - Text style
3. **Personality Deep Dive** (10 min) — Traits, humor, toxic trait, hot takes
4. **Content & Niche** (5-10 min) — Topics, content types, differentiator
5. **Audience & Fantasy** (5 min) — Target viewer, fantasy fulfilled
6. **Spicy Stuff** (5 min) — Explicitness, flirting style
7. **Boundaries & Aesthetic** (3 min) — Hard nos, visual style
8. **Free Flow Capture** (5-10 min) — ⭐ GOLD MINE
   - Full story from her
   - Rant about something
   - Mock video performance

Total: 45-60 minutes

---

# Appendix B: Corpus Cleaning Rules

## Remove entries that:
- Are under 6 seconds
- Contain only "Thanks for watching!" or similar
- Are music lyrics without speech
- Are incomplete transcriptions
- Are not relevant to OF creator content (general comedy)
- Have unintelligible transcription

## Flag for review:
- Duplicate or near-duplicate content
- Entries without creator attribution
- Entries with quality issues but salvageable content

## Quality Score Criteria (0-1):
- 0.0-0.3: Remove (low quality, irrelevant)
- 0.4-0.6: Include with caution (usable patterns)
- 0.7-0.9: Strong examples (primary training)
- 1.0: Exceptional (top-tier viral, use as exemplars)

---

# Appendix C: Prompt Templates

## Profile Extraction Prompt

See separate file: `prompts/profile_extraction.md`

## Hook Generation Prompt

See separate file: `prompts/hook_generation.md`

## Script Expansion Prompt

See separate file: `prompts/script_expansion.md`

## Voice Transformation Prompt

See separate file: `prompts/voice_transformation.md`

## Validation Prompt

See separate file: `prompts/validation.md`

---

# Appendix D: Supabase Setup Commands

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables (see Section 5 for full schema)
-- Run each CREATE TABLE statement

-- Create indexes for performance
CREATE INDEX idx_corpus_embedding ON corpus USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_models_archetype_tags ON models USING GIN (archetype_tags);
CREATE INDEX idx_scripts_model_id ON scripts(model_id);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_hooks_model_id ON hooks(model_id);
CREATE INDEX idx_hooks_hook_type ON hooks(hook_type);
CREATE INDEX idx_performance_script_id ON performance(script_id);
```

---

# Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial specification |
| 1.1 | 2026-01-05 | Changed models.archetype to archetype_tags TEXT[]. Voice profile is now source of truth for generation; archetypes are optional labels. |
| 1.2 | 2026-01-05 | Switched transcription from Deepgram to Google Meet built-in. Added parasocial.strengths/avoid to voice_profile schema. Seeded 14 archetypes. |

---

*This document is the single source of truth for the Viral Script Generation System. All future development should reference this spec.*
