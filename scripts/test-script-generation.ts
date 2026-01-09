/**
 * Test script generation pipeline
 * Run: npm run test-generation
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { generateScripts } from "../src/lib/services/script-generation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Script Generation Pipeline Test\n");
  console.log("=".repeat(60));

  // Find a model with embedding
  const { data: models } = await supabase
    .from("models")
    .select("id, name, stage_name, archetype_tags, voice_profile")
    .not("embedding", "is", null)
    .limit(1);

  if (!models || models.length === 0) {
    console.log("\n⚠️  No models with embeddings found!");
    console.log("Save a model through the onboarding UI first.");

    // Check for any models
    const { data: anyModels } = await supabase
      .from("models")
      .select("id, name, embedding")
      .limit(3);

    if (anyModels?.length) {
      console.log("\nExisting models:");
      for (const m of anyModels) {
        console.log(`  - ${m.name}: embedding=${m.embedding ? "yes" : "no"}`);
      }
    }
    return;
  }

  const model = models[0];
  const voiceProfile = model.voice_profile as any;

  console.log(`\nUsing model: ${model.stage_name || model.name}`);
  console.log(`Archetypes: ${model.archetype_tags?.join(", ") || "none"}`);
  console.log(
    `Niche topics: ${voiceProfile?.content?.niche_topics?.slice(0, 3).join(", ") || "none"}`
  );
  console.log(
    `Energy: ${voiceProfile?.personality?.energy_level || "unknown"}`
  );
  console.log(
    `Explicitness: ${voiceProfile?.spicy?.explicitness_level || "unknown"}`
  );

  console.log("\n" + "=".repeat(60));
  console.log("GENERATING 2 TEST SCRIPTS\n");

  const startTime = Date.now();

  const result = await generateScripts({
    modelId: model.id,
    count: 2,
    // topic: "dating", // Optional: specific topic
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log("RESULTS\n");

  if (!result.success) {
    console.error("❌ Generation failed:", result.error);
    return;
  }

  console.log(`✅ Generated ${result.scripts.length} scripts in ${duration}s\n`);

  for (let i = 0; i < result.scripts.length; i++) {
    const script = result.scripts[i];
    console.log(`\n${"─".repeat(60)}`);
    console.log(`SCRIPT ${i + 1}: ${script.hookType}`);
    console.log(`${"─".repeat(60)}`);
    console.log(`\n${script.content}\n`);
    console.log(`Archetype: ${script.scriptArchetype}`);
    console.log(`Levers: ${script.parasocialLevers.join(", ")}`);
    console.log(`Words: ${script.wordCount} | Duration: ${script.durationEstimate}s`);
    console.log(
      `Voice Fidelity: ${(script.voiceFidelityScore * 100).toFixed(0)}%`
    );
    console.log(`Validation: ${script.validationPassed ? "✓ PASSED" : "✗ FAILED"}`);
    if (script.validationIssues.length > 0) {
      console.log(`Issues: ${script.validationIssues.join(", ")}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("STATS\n");
  console.log(`Total generated: ${result.stats.totalGenerated}`);
  console.log(`Passed validation: ${result.stats.passedValidation}`);
  console.log(
    `Avg voice fidelity: ${(result.stats.avgVoiceFidelity * 100).toFixed(1)}%`
  );
  console.log(`Generation time: ${result.stats.generationTimeMs}ms`);

  console.log("\n" + "=".repeat(60));
  console.log("Test complete!");
}

main().catch(console.error);
