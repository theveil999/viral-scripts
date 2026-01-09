/**
 * @fileoverview API route: scripts/generate
 * @module api/scripts/generate
 */
import { NextRequest, NextResponse } from "next/server";
import {
  generateScripts,
  type GenerationRequest,
} from "@/lib/services/script-generation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/scripts/generate
 * Generate viral scripts for a model using the 6-stage AI pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, topic, hookType, count, explicitnessOverride, saveToDb } =
      body;

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 }
      );
    }

    // Generate scripts
    const generationRequest: GenerationRequest = {
      modelId,
      topic,
      hookType,
      count: count || 1,
      explicitnessOverride,
    };

    const result = await generateScripts(generationRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stats: result.stats },
        { status: 500 }
      );
    }

    // Optionally save to database
    if (saveToDb && result.scripts.length > 0) {
      const supabase = createAdminClient();

      const scriptsToInsert = result.scripts.map((script) => ({
        model_id: modelId,
        content: script.content,
        hook: script.hook,
        hook_type: script.hookType,
        script_archetype: script.scriptArchetype,
        parasocial_levers: script.parasocialLevers,
        duration_seconds: script.durationEstimate,
        word_count: script.wordCount,
        voice_fidelity_score: script.voiceFidelityScore,
        validation_passed: script.validationPassed,
        status: "draft",
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase
        .from("scripts") as any)
        .insert(scriptsToInsert);

      if (insertError) {
        console.error("Failed to save scripts:", insertError);
        // Don't fail the request, just note it in the response
        return NextResponse.json({
          success: true,
          scripts: result.scripts,
          stats: result.stats,
          savedToDb: false,
          saveError: insertError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      scripts: result.scripts,
      stats: result.stats,
      savedToDb: saveToDb || false,
    });
  } catch (error) {
    console.error("Script generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate scripts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
