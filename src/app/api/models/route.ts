/**
 * @fileoverview API route: models
 * @module api/models
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toDbVoiceProfile, ExtractedVoiceProfile } from "@/lib/services/profile-extraction";
import { generateEmbedding, buildVoiceFingerprint } from "@/lib/services/embeddings";

/**
 * POST /api/models
 * Save a new model with extracted voice profile to database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      stage_name,
      transcript,
      voice_profile,
      archetype_tags,
    } = body;

    if (!name && !stage_name) {
      return NextResponse.json(
        { error: "Name or stage name is required" },
        { status: 400 }
      );
    }

    if (!voice_profile) {
      return NextResponse.json(
        { error: "Voice profile is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Use provided archetype_tags or derive from profile
    const finalArchetypeTags = archetype_tags || [
      voice_profile.archetype_assignment?.primary,
      voice_profile.archetype_assignment?.secondary,
    ].filter(Boolean);

    // Transform profile for DB storage
    const dbVoiceProfile = toDbVoiceProfile(voice_profile as ExtractedVoiceProfile);

    const modelData = {
      name: name || voice_profile.identity?.name || "Unknown",
      stage_name: stage_name || voice_profile.identity?.stage_name || null,
      transcript_raw: transcript || null,
      transcript_summary: voice_profile.identity?.quick_bio || null,
      voice_profile: dbVoiceProfile,
      archetype_tags: finalArchetypeTags,
      niche_tags: voice_profile.content?.niche_topics || [],
      boundaries: voice_profile.boundaries || null,
      explicitness_level: voice_profile.spicy?.explicitness_level || null,
      embedding: null,
    };

    const { data, error } = await supabase
      .from("models")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(modelData as any)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save model to database", details: error.message },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = data as any;

    // Generate voice embedding for semantic matching (non-blocking)
    try {
      const voiceFingerprint = buildVoiceFingerprint(voice_profile);
      if (voiceFingerprint.length > 50) {
        const embedding = await generateEmbedding(voiceFingerprint);

        // Update embedding separately (bypass strict typing for vector column)
        await (supabase
          .from("models") as ReturnType<typeof supabase.from>)
          .update({ embedding })
          .eq("id", model.id);

        console.log(`Generated voice embedding for model ${model.id}`);
      }
    } catch (embeddingError) {
      // Non-fatal - log but don't fail the request
      console.error("Failed to generate model embedding:", embeddingError);
    }

    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        stage_name: model.stage_name,
      },
    });
  } catch (error) {
    console.error("Save model error:", error);
    return NextResponse.json(
      {
        error: "Failed to save model",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models
 * List all models.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("models")
      .select("id, name, stage_name, archetype_tags, explicitness_level, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch models", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      models: data,
    });
  } catch (error) {
    console.error("List models error:", error);
    return NextResponse.json(
      {
        error: "Failed to list models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
