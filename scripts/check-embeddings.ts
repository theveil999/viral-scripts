/**
 * Check Corpus Embeddings Status
 *
 * Queries Supabase to check how many corpus entries have embeddings.
 * Run: npx tsx scripts/check-embeddings.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log("\n=== Corpus Embeddings Status ===\n");

  // Get total count
  const { count: totalCount, error: totalError } = await supabase
    .from("corpus")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("Error getting total count:", totalError.message);
    return;
  }

  console.log("Total corpus entries:", totalCount);

  // Sample a few rows to check embedding presence
  const { data: sample, error: sampleError } = await supabase
    .from("corpus")
    .select("id, content, embedding")
    .limit(10);

  if (sampleError) {
    console.error("Error getting sample:", sampleError.message);
    return;
  }

  let withEmbedding = 0;
  let withoutEmbedding = 0;

  sample?.forEach((row) => {
    if (row.embedding !== null) {
      withEmbedding++;
    } else {
      withoutEmbedding++;
    }
  });

  console.log("\nSample of 10 rows:");
  console.log("  With embedding:", withEmbedding);
  console.log("  Without embedding:", withoutEmbedding);

  // Check if embeddings are actually vectors (not null)
  // We need to query specifically for non-null embeddings
  const { data: withEmbeddingData, error: withError } = await supabase
    .from("corpus")
    .select("id")
    .not("embedding", "is", null)
    .limit(1);

  if (withError) {
    console.error("Error checking embeddings:", withError.message);
  } else {
    console.log("\nRows with non-null embedding found:", withEmbeddingData?.length || 0 > 0 ? "Yes" : "No");
  }

  // Get count of rows without embeddings
  const { count: nullCount, error: nullError } = await supabase
    .from("corpus")
    .select("*", { count: "exact", head: true })
    .is("embedding", null);

  if (nullError) {
    console.error("Error counting null embeddings:", nullError.message);
  } else {
    console.log("\n=== Summary ===");
    console.log("Total entries:", totalCount);
    console.log("Without embedding:", nullCount);
    console.log("With embedding:", (totalCount || 0) - (nullCount || 0));

    if (nullCount === 0) {
      console.log("\n✅ All corpus entries have embeddings!");
    } else if (nullCount === totalCount) {
      console.log("\n❌ No corpus entries have embeddings - need to regenerate");
    } else {
      console.log("\n⚠️  Some entries missing embeddings - partial regeneration needed");
    }
  }
}

checkEmbeddings().catch(console.error);
