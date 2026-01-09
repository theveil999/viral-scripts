import { NextRequest, NextResponse } from "next/server";
import {
  extractVoiceProfile,
  ProfileExtractionError,
} from "@/lib/services/profile-extraction";

/**
 * POST /api/models/extract
 * Extract voice profile from transcript WITHOUT saving to database.
 * Returns the extracted profile for preview/editing before save.
 *
 * Body:
 * - transcript: string (required)
 * - modelName: string (optional) - name of the model/creator to focus on
 * - interviewerName: string (optional) - name of the interviewer to ignore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, modelName, interviewerName } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Extract voice profile using Claude, with optional speaker info
    const extractedProfile = await extractVoiceProfile(transcript, {
      modelName,
      interviewerName,
    });

    return NextResponse.json({
      success: true,
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
