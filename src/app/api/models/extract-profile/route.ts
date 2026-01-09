/**
 * @fileoverview API route: models/extract-profile
 * @module api/models/extract-profile
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractVoiceProfile,
  toDbVoiceProfile,
  ProfileExtractionError,
} from "@/lib/services/profile-extraction";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, name, stage_name } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (!name && !stage_name) {
      return NextResponse.json(
        { error: "Name or stage name is required" },
        { status: 400 }
      );
    }

    // Extract voice profile using Claude
    const extractedProfile = await extractVoiceProfile(transcript);

    // Transform for database storage
    const dbVoiceProfile = toDbVoiceProfile(extractedProfile);

    // Save to database
    const supabase = createAdminClient();

    const modelData = {
      name: name || extractedProfile.identity.name || "Unknown",
      stage_name: stage_name || extractedProfile.identity.stage_name || null,
      transcript_raw: transcript,
      transcript_summary: extractedProfile.identity.quick_bio,
      voice_profile: dbVoiceProfile,
      archetype_tags: [
        extractedProfile.archetype_assignment.primary,
        extractedProfile.archetype_assignment.secondary,
      ].filter(Boolean) as string[],
      niche_tags: extractedProfile.content.niche_topics || [],
      boundaries: extractedProfile.boundaries,
      explicitness_level: extractedProfile.spicy.explicitness_level,
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

    return NextResponse.json({
      success: true,
      model_id: model.id,
      model,
      voice_profile: extractedProfile,
    });
  } catch (error) {
    console.error("Profile extraction error:", error);

    if (error instanceof ProfileExtractionError) {
      return NextResponse.json(
        {
          error: error.message,
          raw_response: error.rawResponse,
          validation_errors: error.validationErrors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to extract profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
