/**
 * @fileoverview API route: models
 * @module api/models
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toDbVoiceProfile, ExtractedVoiceProfile } from "@/lib/services/profile-extraction";
import { generateEmbedding, buildVoiceFingerprint } from "@/lib/services/embeddings";
import { requireAuth, optionalAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { validateRequest } from "@/lib/validations";

// Validation schema for creating a model
const createModelSchema = z.object({
  name: z.string().optional(),
  stage_name: z.string().optional(),
  transcript: z.string().optional(),
  voice_profile: z.record(z.string(), z.unknown()),
  archetype_tags: z.array(z.string()).optional(),
}).refine(
  (data) => data.name || data.stage_name,
  { message: "Name or stage name is required" }
);

/**
 * POST /api/models
 * Save a new model with extracted voice profile to database.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(createModelSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const {
      name,
      stage_name,
      transcript,
      voice_profile,
      archetype_tags,
    } = validation.data;

    const supabase = createAdminClient();

    // Use provided archetype_tags or derive from profile
    const vp = voice_profile as unknown as ExtractedVoiceProfile;
    const finalArchetypeTags = archetype_tags || [
      vp.archetype_assignment?.primary,
      vp.archetype_assignment?.secondary,
    ].filter(Boolean);

    // Transform profile for DB storage
    const dbVoiceProfile = toDbVoiceProfile(vp);

    const modelData = {
      name: name || vp.identity?.name || "Unknown",
      stage_name: stage_name || vp.identity?.stage_name || null,
      transcript_raw: transcript || null,
      transcript_summary: vp.identity?.quick_bio || null,
      voice_profile: dbVoiceProfile,
      archetype_tags: finalArchetypeTags,
      niche_tags: vp.content?.niche_topics || [],
      boundaries: vp.boundaries || null,
      explicitness_level: vp.spicy?.explicitness_level || null,
      embedding: null,
      // user_id: authResult.id, // TODO: Uncomment when user_id column exists
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
 * List all models. Auth optional for read.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional auth for listing (could filter by user later)
    await optionalAuth(request);
    
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("models")
      .select("id, name, stage_name, archetype_tags, explicitness_level, created_at")
      .order("created_at", { ascending: false })
      .limit(100); // Add pagination limit

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
