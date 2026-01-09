/**
 * Database types for Viral Scripts
 * Generated from Supabase schema
 */

// ============================================
// Voice Profile JSONB Structure
// ============================================
export interface VoiceProfile {
  identity: {
    name: string;
    stage_name: string;
    nicknames_fans_use: string[];
    origin_location: string;
    age_range: string;
    quick_bio: string;
  };
  voice_mechanics: {
    filler_words: Array<{ word: string; frequency: "high" | "medium" | "low" }>;
    sentence_starters: string[];
    avg_sentence_length: "short" | "medium" | "long";
    sentence_style: "fragmented" | "complete" | "run-on";
    question_frequency: "high" | "medium" | "low";
    self_interruption_patterns: string[];
    swear_words: string[];
    swear_frequency: "high" | "medium" | "low" | "none";
    catchphrases: string[];
    cta_style: string;
    emphasis_style: {
      uses_caps: boolean;
      stretches_words: boolean;
      uses_repetition: boolean;
    };
    text_style: {
      lowercase_preference: boolean;
      emoji_usage: "heavy" | "moderate" | "minimal" | "none";
      abbreviations: string[];
    };
  };
  personality: {
    self_described_traits: string[];
    friend_described_traits: string[];
    humor_style: "roaster" | "hype_girl" | "both";
    energy_level: "high" | "medium" | "low";
    toxic_trait: string;
    hot_takes: string[];
  };
  content: {
    niche_topics: string[];
    can_talk_hours_about: string[];
    content_types: string[];
    differentiator: string;
    strong_opinions_on: string[];
    trends_she_hates: string[];
    brand_anchors?: string[]; // CRITICAL: Unique brand obsessions like Taco Bell
  };
  audience: {
    target_viewer_description: string;
    fantasy_fulfilled: string;
    how_fans_talk_to_her: string;
    best_performing_content: string;
  };
  spicy: {
    explicitness_level: "subtle" | "medium" | "full_send";
    flirting_style: string;
    turn_ons_discussed: string[];
    her_type: string;
    bedroom_dynamic?: string; // dominant/submissive/switch
    sexual_vocabulary?: {
      body_part_euphemisms?: {
        female_genitalia?: string[];
        male_genitalia?: string[];
        breasts?: string[];
        butt_anal?: string[];
      };
      act_euphemisms?: {
        oral_giving?: string[];
        oral_receiving?: string[];
        intercourse?: string[];
        orgasm?: string[];
        masturbation?: string[];
        ejaculation?: string[];
      };
      intensity_markers?: string[];
      signature_spicy_phrases?: string[];
    };
  };
  boundaries: {
    hard_nos: string[];
    topics_to_avoid: string[];
  };
  aesthetic: {
    visual_style: string;
    colors_vibes: string;
    content_energy: string;
  };
  parasocial: {
    strengths: string[];
    avoid: string[];
  };
  // Alias for parasocial - some code uses this name
  parasocial_config?: {
    strengths: string[];
    avoid?: string[];
  };
  archetype_assignment: {
    primary: string;
    secondary: string | null;
    mix?: Record<string, number>;
    confidence: number;
  };
  sample_speech: string[];
}

// ============================================
// Table Row Types
// ============================================

export interface Model {
  id: string;
  name: string;
  stage_name: string | null;
  transcript_raw: string | null;
  transcript_summary: string | null;
  voice_profile: VoiceProfile;
  archetype_tags: string[];
  niche_tags: string[];
  boundaries: { hard_nos: string[]; topics_to_avoid: string[] } | null;
  explicitness_level: "subtle" | "medium" | "full_send" | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  model_id: string;
  batch_id: string | null;
  content: string;
  hook: string | null;
  hook_type: string | null;
  script_archetype: string | null;
  parasocial_levers: string[];
  duration_seconds: number | null;
  word_count: number | null;
  voice_fidelity_score: number | null;
  validation_passed: boolean;
  status: "draft" | "approved" | "posted" | "archived";
  embedding: number[] | null;
  created_at: string;
  approved_at: string | null;
  posted_at: string | null;
  posted_url: string | null;
  // Kane Framework additions
  variation_group_id: string | null;
  shareability_score: number | null;
  share_trigger: string | null;
  share_prediction: string | null;
  emotional_response: string | null;
  cta_type: string | null;
  pcm_type: string | null;
}

export interface ScriptBatch {
  id: string;
  batch_id: string;
  model_id: string;
  hooks_requested: number;
  scripts_generated: number;
  scripts_passed: number;
  scripts_failed: number;
  avg_voice_fidelity: number | null;
  avg_word_count: number | null;
  total_time_ms: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  pipeline_version: string | null;
  created_at: string;
}

export interface Corpus {
  id: string;
  content: string;
  creator: string | null;
  duration_seconds: number | null;
  hook: string | null;
  hook_type: string | null;
  script_archetype: string | null;
  parasocial_levers: string[];
  emotional_arc: string | null;
  niche_tags: string[];
  quality_score: number | null;
  is_active: boolean;
  embedding: number[] | null;
  created_at: string;
}

export interface Hook {
  id: string;
  content: string;
  hook_type: string;
  source: "corpus" | "generated" | "model_specific" | null;
  model_id: string | null;
  corpus_id: string | null;
  times_used: number;
  last_used_at: string | null;
  avg_performance_score: number | null;
  freshness_score: number;
  embedding: number[] | null;
  created_at: string;
  // Kane Framework additions
  variation_group_id: string | null;
  pcm_type: string | null;
  variation_strategy: string | null;
  shareability_score: number | null;
}

// Kane Framework: Script Variation Groups
export interface ScriptVariationGroup {
  id: string;
  model_id: string;
  concept: string;
  concept_description: string | null;
  hook_count: number;
  best_performing_variation_id: string | null;
  created_at: string;
  updated_at: string;
}

// Kane Framework: A/B Test Results
export interface ABTestResult {
  id: string;
  variation_group_id: string;
  script_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number | null;
  share_rate: number | null;
  test_started_at: string | null;
  test_ended_at: string | null;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
}

export interface Performance {
  id: string;
  script_id: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  estimated_conversions: number | null;
  conversion_notes: string | null;
  posted_at: string | null;
  tracked_at: string;
}

export interface Archetype {
  id: string;
  name: string;
  description: string | null;
  effective_hook_types: string[];
  effective_parasocial_levers: string[];
  effective_script_archetypes: string[];
  typical_energy_level: "high" | "medium" | "low" | null;
  typical_explicitness: "subtle" | "medium" | "full_send" | null;
  common_phrases: string[];
  avg_performance_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParasocialLever {
  id: string;
  name: string;
  description: string;
  implementation_notes: string | null;
  example: string | null;
  intensity: "low" | "medium" | "high";
  usage_guidance: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Database Type (for Supabase client)
// ============================================

// Insert type for models - only required fields are mandatory
export interface ModelInsert {
  name: string;
  voice_profile: VoiceProfile | Record<string, unknown>;
  stage_name?: string | null;
  transcript_raw?: string | null;
  transcript_summary?: string | null;
  archetype_tags?: string[];
  niche_tags?: string[];
  boundaries?: { hard_nos: string[]; topics_to_avoid: string[] } | Record<string, unknown> | null;
  explicitness_level?: "subtle" | "medium" | "full_send" | null;
  embedding?: number[] | null;
}

export interface Database {
  public: {
    Tables: {
      models: {
        Row: Model;
        Insert: ModelInsert;
        Update: Partial<ModelInsert>;
      };
      scripts: {
        Row: Script;
        Insert: Omit<Script, "id" | "created_at" | "approved_at" | "posted_at" | "posted_url"> & {
          id?: string;
          created_at?: string;
          approved_at?: string | null;
          posted_at?: string | null;
          posted_url?: string | null;
        };
        Update: Partial<Omit<Script, "id" | "created_at">>;
      };
      corpus: {
        Row: Corpus;
        Insert: Omit<Corpus, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Corpus, "id" | "created_at">>;
      };
      hooks: {
        Row: Hook;
        Insert: Omit<Hook, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Hook, "id" | "created_at">>;
      };
      performance: {
        Row: Performance;
        Insert: Omit<Performance, "id" | "tracked_at"> & {
          id?: string;
          tracked_at?: string;
        };
        Update: Partial<Omit<Performance, "id" | "tracked_at">>;
      };
      archetypes: {
        Row: Archetype;
        Insert: Omit<Archetype, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Archetype, "id" | "created_at">>;
      };
      parasocial_levers: {
        Row: ParasocialLever;
        Insert: Omit<ParasocialLever, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ParasocialLever, "id" | "created_at">>;
      };
      script_batches: {
        Row: ScriptBatch;
        Insert: Omit<ScriptBatch, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ScriptBatch, "id" | "created_at">>;
      };
      // Kane Framework additions
      script_variation_groups: {
        Row: ScriptVariationGroup;
        Insert: Omit<ScriptVariationGroup, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ScriptVariationGroup, "id" | "created_at">>;
      };
      ab_test_results: {
        Row: ABTestResult;
        Insert: Omit<ABTestResult, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ABTestResult, "id" | "created_at">>;
      };
    };
  };
}

// ============================================
// Helper Types
// ============================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
