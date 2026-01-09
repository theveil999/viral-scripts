/**
 * End-to-End Test: Full Script Generation Pipeline
 * 
 * This script tests the complete flow:
 * 1. Creates a test model in Supabase
 * 2. Calls the script generation API
 * 3. Verifies script was saved to database
 * 4. Logs results
 * 5. Cleans up test data
 * 
 * Run: npm run test-e2e
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env.local before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from "@supabase/supabase-js";
import { generateScripts } from "../src/lib/services/script-generation";

// Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal test voice profile
const TEST_VOICE_PROFILE = {
  identity: {
    name: "Test Model",
    stage_name: "TestyMcTestFace",
    nicknames_fans_use: ["testy"],
    origin_location: "Test City, USA",
    age_range: "20s",
    quick_bio: "A test model for e2e testing",
  },
  voice_mechanics: {
    filler_words: [
      { word: "like", frequency: "high" as const },
      { word: "literally", frequency: "medium" as const },
    ],
    sentence_starters: ["okay so", "honestly", "like"],
    avg_sentence_length: "medium" as const,
    sentence_style: "run-on" as const,
    question_frequency: "high" as const,
    self_interruption_patterns: ["wait no", "actually"],
    swear_words: ["fuck", "shit"],
    swear_frequency: "medium" as const,
    catchphrases: ["follow me i miss you", "god forbid"],
    cta_style: "follow me i miss you",
    emphasis_style: {
      uses_caps: false,
      stretches_words: true,
      uses_repetition: true,
    },
    text_style: {
      lowercase_preference: true,
      emoji_usage: "minimal" as const,
      abbreviations: ["rn", "ngl", "tbh"],
    },
  },
  personality: {
    self_described_traits: ["chaotic", "unhinged", "honest"],
    friend_described_traits: ["funny", "loud"],
    humor_style: "roaster" as const,
    energy_level: "high" as const,
    toxic_trait: "im too honest",
    hot_takes: ["pineapple on pizza is elite"],
  },
  content: {
    niche_topics: ["dating", "relationships", "spicy takes"],
    can_talk_hours_about: ["dating red flags"],
    content_types: ["talking to camera", "storytime"],
    differentiator: "unfiltered honesty",
    strong_opinions_on: ["dating apps"],
    trends_she_hates: ["toxic positivity"],
  },
  audience: {
    target_viewer_description: "millennials who are tired of dating",
    fantasy_fulfilled: "relatable chaos",
    how_fans_talk_to_her: "like a friend",
    best_performing_content: "dating rants",
  },
  spicy: {
    explicitness_level: "medium" as const,
    flirting_style: "playful teasing",
    turn_ons_discussed: ["confidence", "humor"],
    her_type: "tall funny guys",
  },
  boundaries: {
    hard_nos: [],
    topics_to_avoid: [],
  },
  aesthetic: {
    visual_style: "casual",
    colors_vibes: "warm tones",
    content_energy: "chaotic but relatable",
  },
  parasocial: {
    strengths: ["vulnerability", "relatability", "confession"],
    avoid: ["dominance"],
  },
  archetype_assignment: {
    primary: "chaotic_unhinged",
    secondary: "cool_girl",
    confidence: 0.85,
  },
  sample_speech: [
    "okay so like i need to tell you about this guy i went on a date with",
    "honestly im so tired of men who cant communicate like sir use your words",
    "follow me i miss you and also i need validation",
  ],
};

async function runE2ETest() {
  console.log("\n" + "=".repeat(60));
  console.log("E2E TEST: Full Script Generation Pipeline");
  console.log("=".repeat(60) + "\n");

  let testModelId: string | null = null;
  let testScriptIds: string[] = [];

  try {
    // Step 1: Create test model
    console.log("[1/5] Creating test model...");
    const { data: modelData, error: modelError } = await supabase
      .from("models")
      .insert({
        name: "E2E Test Model",
        stage_name: "TestyMcTestFace",
        voice_profile: TEST_VOICE_PROFILE,
        archetype_tags: ["chaotic_unhinged", "cool_girl"],
        explicitness_level: "medium",
      })
      .select()
      .single();

    if (modelError) {
      throw new Error("Failed to create test model: " + modelError.message);
    }

    testModelId = modelData.id;
    console.log("   ✓ Created test model: " + testModelId);

    // Step 2: Generate script via service (bypassing HTTP for speed)
    console.log("\n[2/5] Generating script via 6-stage pipeline...");
    console.log("   This may take 30-60 seconds...");

    const startTime = Date.now();
    const result = await generateScripts({
      modelId: testModelId!, // Already checked modelError above
      count: 1,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!result.success) {
      throw new Error("Script generation failed: " + result.error);
    }

    console.log("   ✓ Generated " + result.scripts.length + " script(s) in " + duration + "s");

    // Step 3: Save to database
    console.log("\n[3/5] Saving script to database...");
    
    const scriptsToInsert = result.scripts.map((script) => ({
      model_id: testModelId,
      content: script.content,
      hook: script.hook,
      hook_type: script.hookType,
      script_archetype: script.scriptArchetype,
      parasocial_levers: script.parasocialLevers,
      duration_estimate: script.durationEstimate,
      word_count: script.wordCount,
      voice_fidelity_score: script.voiceFidelityScore,
      validation_passed: script.validationPassed,
      status: "draft",
    }));

    const { data: savedScripts, error: saveError } = await supabase
      .from("scripts")
      .insert(scriptsToInsert)
      .select();

    if (saveError) {
      throw new Error("Failed to save scripts: " + saveError.message);
    }

    testScriptIds = savedScripts.map((s: { id: string }) => s.id);
    console.log("   ✓ Saved " + testScriptIds.length + " script(s) to database");

    // Step 4: Verify and display results
    console.log("\n[4/5] Verifying results...");
    
    const { data: verifyData, error: verifyError } = await supabase
      .from("scripts")
      .select("*")
      .in("id", testScriptIds);

    if (verifyError || !verifyData || verifyData.length === 0) {
      throw new Error("Verification failed: scripts not found in database");
    }

    console.log("   ✓ Verified " + verifyData.length + " script(s) in database");

    // Display results
    console.log("\n" + "-".repeat(60));
    console.log("GENERATED SCRIPT:");
    console.log("-".repeat(60));
    
    const script = result.scripts[0];
    console.log("\nHook: \"" + script.hook + "\"");
    console.log("\nContent:");
    console.log(script.content);
    console.log("\nMetadata:");
    console.log("  Hook Type:      " + script.hookType);
    console.log("  Archetype:      " + script.scriptArchetype);
    console.log("  Levers:         " + script.parasocialLevers.join(", "));
    console.log("  Duration:       " + script.durationEstimate + "s");
    console.log("  Word Count:     " + script.wordCount);
    console.log("  Voice Fidelity: " + (script.voiceFidelityScore ? (script.voiceFidelityScore * 100).toFixed(1) : "N/A") + "%");
    console.log("  Validation:     " + (script.validationPassed ? "PASSED" : "FAILED"));

    // Display pipeline stats
    if (result.stats) {
      console.log("\nPipeline Stats:");
      console.log("  Total Time:       " + duration + "s");
      console.log("  Total Generated:  " + result.stats.totalGenerated);
      console.log("  Passed Validation:" + result.stats.passedValidation);
      console.log("  Avg Fidelity:     " + (result.stats.avgVoiceFidelity * 100).toFixed(1) + "%");
    }

    // Step 5: Cleanup
    console.log("\n[5/5] Cleaning up test data...");
    
    // Delete test scripts
    if (testScriptIds.length > 0) {
      const { error: deleteScriptsError } = await supabase
        .from("scripts")
        .delete()
        .in("id", testScriptIds);
      
      if (deleteScriptsError) {
        console.log("   ⚠ Warning: Failed to delete test scripts: " + deleteScriptsError.message);
      } else {
        console.log("   ✓ Deleted " + testScriptIds.length + " test script(s)");
      }
    }

    // Delete test model
    if (testModelId) {
      const { error: deleteModelError } = await supabase
        .from("models")
        .delete()
        .eq("id", testModelId);
      
      if (deleteModelError) {
        console.log("   ⚠ Warning: Failed to delete test model: " + deleteModelError.message);
      } else {
        console.log("   ✓ Deleted test model");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ E2E TEST PASSED");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ E2E TEST FAILED:", error);

    // Cleanup on failure
    console.log("\nAttempting cleanup...");
    
    if (testScriptIds.length > 0) {
      await supabase.from("scripts").delete().in("id", testScriptIds);
    }
    
    if (testModelId) {
      await supabase.from("models").delete().eq("id", testModelId);
    }

    process.exit(1);
  }
}

runE2ETest();
