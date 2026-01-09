/**
 * Test hybrid corpus retrieval
 * Run: npm run test-retrieval
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CorpusMatch {
  id: string;
  hook: string | null;
  hook_type: string | null;
  script_archetype: string | null;
  parasocial_levers: string[] | null;
  quality_score: number | null;
  similarity_score: number;
  match_reasons: string[] | null;
}

async function main() {
  console.log("Testing Hybrid Corpus Retrieval\n");
  console.log("=".repeat(60));

  // Check corpus embeddings
  const { count: embeddedCount } = await supabase
    .from("corpus")
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null);

  const { count: totalCount } = await supabase
    .from("corpus")
    .select("*", { count: "exact", head: true });

  console.log(`\nCorpus: ${embeddedCount}/${totalCount} entries have embeddings`);

  if (!embeddedCount || embeddedCount === 0) {
    console.log("\n⚠️  No corpus embeddings found!");
    console.log("Run: npm run generate-embeddings");
    return;
  }

  // Find a model with embedding
  const { data: models } = await supabase
    .from("models")
    .select("id, name, archetype_tags, embedding, voice_profile")
    .not("embedding", "is", null)
    .limit(1);

  if (!models || models.length === 0) {
    console.log("\n⚠️  No models with embeddings found!");
    console.log("Save a model through the onboarding UI first.");

    // Try to find any model and show info
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

  console.log(`\nUsing model: ${model.name}`);
  console.log(`Archetypes: ${model.archetype_tags?.join(", ") || "none"}`);
  console.log(
    `Parasocial strengths: ${
      voiceProfile?.parasocial_config?.strengths?.join(", ") ||
      voiceProfile?.parasocial?.strengths?.join(", ") ||
      "none"
    }`
  );

  // Test diversified search
  console.log("\n" + "=".repeat(60));
  console.log("DIVERSIFIED SEARCH (variety across hook types)\n");

  const leverFilter =
    voiceProfile?.parasocial_config?.strengths ||
    voiceProfile?.parasocial?.strengths ||
    null;

  const { data: diversified, error: divError } = await supabase.rpc(
    "match_corpus_diversified",
    {
      query_embedding: model.embedding,
      total_count: 10,
      per_hook_type: 2,
      min_similarity: 0.25,
      archetype_filter: model.archetype_tags?.length
        ? model.archetype_tags
        : null,
      lever_filter: leverFilter,
    }
  );

  if (divError) {
    console.error("Search error:", divError);
    return;
  }

  console.log(`Found ${diversified?.length || 0} matches:\n`);

  const byHookType: Record<string, CorpusMatch[]> = {};
  for (const match of (diversified as CorpusMatch[]) || []) {
    const type = match.hook_type || "unknown";
    if (!byHookType[type]) byHookType[type] = [];
    byHookType[type].push(match);
  }

  for (const [hookType, matches] of Object.entries(byHookType)) {
    console.log(`\n📌 ${hookType.toUpperCase()} (${matches.length})`);
    for (const m of matches) {
      const simPercent = (m.similarity_score * 100).toFixed(0);
      const hookPreview = m.hook?.slice(0, 50) || "(no hook)";
      console.log(`   [${simPercent}%] ${hookPreview}...`);
      if (m.match_reasons?.length) {
        console.log(`       Reasons: ${m.match_reasons.join(", ")}`);
      }
    }
  }

  // Stats
  console.log("\n" + "=".repeat(60));
  console.log("STATS\n");

  const results = (diversified as CorpusMatch[]) || [];
  const avgSim =
    results.reduce((s, m) => s + m.similarity_score, 0) / (results.length || 1);
  const archetypeMatches = results.filter((m) =>
    m.match_reasons?.includes("archetype_match")
  ).length;
  const leverMatches = results.filter((m) =>
    m.match_reasons?.includes("lever_match")
  ).length;

  console.log(`Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`Archetype matches: ${archetypeMatches}/${results.length}`);
  console.log(`Lever matches: ${leverMatches}/${results.length}`);

  console.log("\n" + "=".repeat(60));
  console.log("Test complete!");
}

main().catch(console.error);
