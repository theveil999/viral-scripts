/**
 * Voice Profile Extraction Service
 * Calls Claude API to extract structured voice profiles from transcripts
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  buildProfileExtractionPrompt,
  VALID_ARCHETYPES,
  VALID_PARASOCIAL_LEVERS,
  type ExtractionConfig,
} from "../prompts/profile-extraction";

// Extended VoiceProfile type that matches the gold standard from EXAMPLES.md
export interface ExtractedVoiceProfile {
  identity: {
    name: string | null;
    stage_name: string;
    nicknames_fans_use: string[];
    origin_location: string | null;
    age_range: string | null;
    quick_bio: string;
  };

  voice_mechanics: {
    filler_words: Array<{ word: string; frequency: "high" | "medium" | "low" }>;
    sentence_starters: string[];
    sentence_enders: string[];
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
      grammar_strictness?: "strict" | "relaxed" | "chaotic";
    };
  };

  personality: {
    self_described_traits: string[];
    friend_described_traits: string[];
    humor_style: string;
    energy_level: "high" | "medium" | "low";
    toxic_trait: string | null;
    hot_takes: string[];
    conflict_style?: string | null;
  };

  content: {
    niche_topics: string[];
    can_talk_hours_about: string[];
    content_types: string[];
    differentiator: string;
    strong_opinions_on: string[];
    trends_she_hates: string[];
    brand_anchors?: string[];
  };

  audience: {
    target_viewer_description: string | null;
    fantasy_fulfilled: string | null;
    how_fans_talk_to_her: string | null;
    best_performing_content: string | null;
  };

  spicy: {
    explicitness_level: "subtle" | "medium" | "full_send";
    flirting_style: string;
    turn_ons_discussed: string[];
    her_type: string | null;
    bedroom_dynamic?: string | null;
  };

  boundaries: {
    hard_nos: string[];
    topics_to_avoid: string[];
  };

  aesthetic: {
    visual_style: string | null;
    colors_vibes: string | null;
    content_energy: string | null;
  };

  archetype_assignment: {
    primary: string;
    secondary: string | null;
    mix?: Record<string, number>;
    confidence: number;
  };

  parasocial_config: {
    strengths: string[];
    avoid: string[];
    custom_levers?: string[];
  };

  voice_transformation_rules?: {
    always_include: string[];
    never_include: string[];
    tone_calibration: {
      baseline: string;
      spicy_content: string;
      vulnerability: string;
    };
  };

  sample_speech: string[];
}

export class ProfileExtractionError extends Error {
  constructor(
    message: string,
    public rawResponse?: string,
    public validationErrors?: string[]
  ) {
    super(message);
    this.name = "ProfileExtractionError";
  }
}

// Lazy initialization to allow env vars to load first
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

/**
 * Extract a voice profile from a transcript using Claude
 */
export async function extractVoiceProfile(
  transcript: string,
  config?: ExtractionConfig
): Promise<ExtractedVoiceProfile> {
  if (!transcript || transcript.trim().length < 100) {
    throw new ProfileExtractionError(
      "Transcript too short. Need at least 100 characters for meaningful extraction."
    );
  }

  const prompt = buildProfileExtractionPrompt(transcript, config);

  const message = await getAnthropicClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  if (!responseText) {
    throw new ProfileExtractionError("Empty response from Claude API");
  }

  // Parse JSON response
  let profile: ExtractedVoiceProfile;
  try {
    // Try direct parse first
    profile = JSON.parse(responseText);
  } catch {
    // Try to extract JSON from markdown code block if wrapped
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        profile = JSON.parse(jsonMatch[1].trim());
      } catch (innerError) {
        throw new ProfileExtractionError(
          `Failed to parse JSON from code block: ${innerError instanceof Error ? innerError.message : "Unknown error"}`,
          responseText
        );
      }
    } else {
      throw new ProfileExtractionError(
        "Failed to parse voice profile JSON from response",
        responseText
      );
    }
  }

  // Sanitize: Convert empty strings to null for audience fields
  // (catches cases where Claude returns '' instead of null)
  if (profile.audience) {
    const audience = profile.audience;
    if (audience.target_viewer_description === '') audience.target_viewer_description = null;
    if (audience.fantasy_fulfilled === '') audience.fantasy_fulfilled = null;
    if (audience.how_fans_talk_to_her === '') audience.how_fans_talk_to_her = null;
    if (audience.best_performing_content === '') audience.best_performing_content = null;
  }

  // Sanitize: Ensure boundaries arrays exist (not undefined)
  if (profile.boundaries) {
    if (!Array.isArray(profile.boundaries.hard_nos)) profile.boundaries.hard_nos = [];
    if (!Array.isArray(profile.boundaries.topics_to_avoid)) profile.boundaries.topics_to_avoid = [];
  }

  // Validate required fields
  const validationErrors = validateProfile(profile);
  if (validationErrors.length > 0) {
    throw new ProfileExtractionError(
      `Profile validation failed: ${validationErrors.join(", ")}`,
      JSON.stringify(profile, null, 2),
      validationErrors
    );
  }

  return profile;
}

/**
 * Validate extracted profile has required fields
 */
function validateProfile(profile: unknown): string[] {
  const errors: string[] = [];

  if (!profile || typeof profile !== "object") {
    return ["Profile is not an object"];
  }

  const p = profile as Record<string, unknown>;

  // Required top-level sections
  const requiredSections = [
    "identity",
    "voice_mechanics",
    "personality",
    "content",
    "audience",
    "spicy",
    "boundaries",
    "archetype_assignment",
    "sample_speech",
  ];

  for (const section of requiredSections) {
    if (!p[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Validate identity
  if (p.identity && typeof p.identity === "object") {
    const identity = p.identity as Record<string, unknown>;
    if (!identity.stage_name && !identity.name) {
      errors.push("identity must have at least stage_name or name");
    }
  }

  // Validate archetype_assignment
  if (p.archetype_assignment && typeof p.archetype_assignment === "object") {
    const archetype = p.archetype_assignment as Record<string, unknown>;
    if (!archetype.primary) {
      errors.push("archetype_assignment.primary is required");
    } else if (
      !VALID_ARCHETYPES.includes(archetype.primary as (typeof VALID_ARCHETYPES)[number])
    ) {
      errors.push(
        `Invalid archetype: ${archetype.primary}. Must be one of: ${VALID_ARCHETYPES.join(", ")}`
      );
    }
    if (
      archetype.secondary &&
      !VALID_ARCHETYPES.includes(archetype.secondary as (typeof VALID_ARCHETYPES)[number])
    ) {
      errors.push(`Invalid secondary archetype: ${archetype.secondary}`);
    }
  }

  // Validate parasocial_config levers if present
  if (p.parasocial_config && typeof p.parasocial_config === "object") {
    const parasocial = p.parasocial_config as Record<string, unknown>;
    const checkLevers = (levers: unknown, fieldName: string) => {
      if (Array.isArray(levers)) {
        for (const lever of levers) {
          if (
            typeof lever === "string" &&
            !VALID_PARASOCIAL_LEVERS.includes(lever as (typeof VALID_PARASOCIAL_LEVERS)[number])
          ) {
            // Allow custom levers, just warn
            console.warn(`Non-standard parasocial lever in ${fieldName}: ${lever}`);
          }
        }
      }
    };
    checkLevers(parasocial.strengths, "strengths");
    checkLevers(parasocial.avoid, "avoid");
  }

  // Validate sample_speech has content
  if (p.sample_speech) {
    if (!Array.isArray(p.sample_speech)) {
      errors.push("sample_speech must be an array");
    } else if (p.sample_speech.length < 3) {
      errors.push("sample_speech should have at least 3 verbatim quotes");
    }
  }

  // Validate voice_mechanics
  if (p.voice_mechanics && typeof p.voice_mechanics === "object") {
    const vm = p.voice_mechanics as Record<string, unknown>;
    if (!vm.swear_frequency) {
      errors.push("voice_mechanics.swear_frequency is required");
    }
    if (!vm.energy_level && p.personality) {
      // Check in personality instead
    }
  }

  // Validate spicy.explicitness_level
  if (p.spicy && typeof p.spicy === "object") {
    const spicy = p.spicy as Record<string, unknown>;
    const validLevels = ["subtle", "medium", "full_send"];
    if (spicy.explicitness_level && !validLevels.includes(spicy.explicitness_level as string)) {
      errors.push(
        `Invalid explicitness_level: ${spicy.explicitness_level}. Must be: ${validLevels.join(", ")}`
      );
    }
  }

  return errors;
}

/**
 * Transform ExtractedVoiceProfile to the simpler VoiceProfile for DB storage
 * (backward compatible with existing schema)
 */
export function toDbVoiceProfile(extracted: ExtractedVoiceProfile): Record<string, unknown> {
  return {
    identity: extracted.identity,
    voice_mechanics: extracted.voice_mechanics,
    personality: extracted.personality,
    content: extracted.content,
    audience: extracted.audience,
    spicy: extracted.spicy,
    boundaries: extracted.boundaries,
    aesthetic: extracted.aesthetic,
    parasocial: {
      strengths: extracted.parasocial_config?.strengths || [],
      avoid: extracted.parasocial_config?.avoid || [],
    },
    archetype_assignment: extracted.archetype_assignment,
    sample_speech: extracted.sample_speech,
    // Include extended fields
    voice_transformation_rules: extracted.voice_transformation_rules,
  };
}
