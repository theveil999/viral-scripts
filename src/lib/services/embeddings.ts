/**
 * Embedding Utilities
 * Generate embeddings for semantic search using OpenAI text-embedding-3-small
 */

import OpenAI from "openai";

// Lazy initialization for OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate an embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000), // Token limit safety
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single API call
 * OpenAI supports up to 2048 inputs per request
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return response.data.map((d) => d.embedding);
}

/**
 * Build a voice fingerprint string from a model's voice profile
 * Combines: sample_speech + catchphrases + core_essence + filler patterns + audience targeting
 * This creates a semantic representation of how the model speaks
 */
export function buildVoiceFingerprint(voiceProfile: VoiceProfileInput): string {
  const parts: string[] = [];

  // Sample speech (most important - actual voice samples)
  if (voiceProfile.sample_speech?.length) {
    parts.push("VOICE SAMPLES:");
    parts.push(voiceProfile.sample_speech.join(" | "));
  }

  // Catchphrases
  if (voiceProfile.voice_mechanics?.catchphrases?.length) {
    parts.push(
      "CATCHPHRASES: " + voiceProfile.voice_mechanics.catchphrases.join(", ")
    );
  }

  // Quick bio / essence
  if (voiceProfile.identity?.quick_bio) {
    parts.push("PERSONALITY: " + voiceProfile.identity.quick_bio);
  }

  // Humor style
  if (voiceProfile.personality?.humor_style) {
    parts.push("HUMOR: " + voiceProfile.personality.humor_style);
  }

  // Energy level
  if (voiceProfile.personality?.energy_level) {
    parts.push("ENERGY: " + voiceProfile.personality.energy_level);
  }

  // Explicitness level
  if (voiceProfile.spicy?.explicitness_level) {
    parts.push("EXPLICITNESS: " + voiceProfile.spicy.explicitness_level);
  }

  // Filler words (captures speech rhythm)
  if (voiceProfile.voice_mechanics?.filler_words?.length) {
    const highFreqFillers = voiceProfile.voice_mechanics.filler_words
      .filter((f) => f.frequency === "high")
      .map((f) => f.word);
    if (highFreqFillers.length) {
      parts.push("SPEECH PATTERNS: " + highFreqFillers.join(", "));
    }
  }

  // Sentence starters (distinctive speech patterns)
  if (voiceProfile.voice_mechanics?.sentence_starters?.length) {
    parts.push(
      "SENTENCE STARTERS: " +
        voiceProfile.voice_mechanics.sentence_starters.slice(0, 5).join(", ")
    );
  }

  // Parasocial strengths (what makes her content connect)
  if (voiceProfile.parasocial_config?.strengths?.length) {
    parts.push(
      "CONNECTION STYLE: " +
        voiceProfile.parasocial_config.strengths.join(", ")
    );
  }

  // CRITICAL: Audience targeting data (for parasocial content matching)
  if (voiceProfile.audience?.target_viewer_description) {
    parts.push(
      "TARGET AUDIENCE: " + voiceProfile.audience.target_viewer_description
    );
  }
  if (voiceProfile.audience?.fantasy_fulfilled) {
    parts.push(
      "FANTASY FULFILLED: " + voiceProfile.audience.fantasy_fulfilled
    );
  }

  return parts.join("\n");
}

// Type for voice profile input (subset of full profile)
interface VoiceProfileInput {
  sample_speech?: string[];
  voice_mechanics?: {
    catchphrases?: string[];
    filler_words?: Array<{ word: string; frequency: string }>;
    sentence_starters?: string[];
  };
  identity?: {
    quick_bio?: string;
  };
  personality?: {
    humor_style?: string;
    energy_level?: string;
  };
  spicy?: {
    explicitness_level?: string;
  };
  parasocial_config?: {
    strengths?: string[];
  };
  // CRITICAL: Audience targeting for parasocial content matching
  audience?: {
    target_viewer_description?: string;
    fantasy_fulfilled?: string;
  };
}
