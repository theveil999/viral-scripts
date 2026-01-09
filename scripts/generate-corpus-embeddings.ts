/**
 * Generate embeddings for corpus entries
 * Run: npm run generate-embeddings
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const BATCH_SIZE = 50; // OpenAI allows up to 2048 inputs per request

interface CorpusEntry {
  id: string;
  content: string;
  hook: string | null;
  hook_type: string | null;
  script_archetype: string | null;
}

async function main() {
  console.log("Corpus Embedding Generation\n");
  console.log("=".repeat(50));

  // Get entries missing embeddings
  const { data: entries, error } = await supabase
    .from("corpus")
    .select("id, content, hook, hook_type, script_archetype")
    .is("embedding", null);

  if (error) {
    console.error("Error fetching corpus:", error);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("All corpus entries have embeddings!");

    // Show total count
    const { count: total } = await supabase
      .from("corpus")
      .select("*", { count: "exact", head: true })
      .not("embedding", "is", null);

    console.log(`Total embedded: ${total}`);
    return;
  }

  console.log(`Found ${entries.length} entries without embeddings\n`);

  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE) as CorpusEntry[];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entries.length / BATCH_SIZE);

    process.stdout.write(`Batch ${batchNum}/${totalBatches}... `);

    try {
      // Build text to embed for each entry
      // Include hook + content for richer semantic meaning
      const textsToEmbed = batch.map((entry) => {
        const parts = [];
        if (entry.hook) parts.push(`HOOK: ${entry.hook}`);
        if (entry.hook_type) parts.push(`TYPE: ${entry.hook_type}`);
        if (entry.script_archetype) parts.push(`STYLE: ${entry.script_archetype}`);
        parts.push(`SCRIPT: ${entry.content}`);
        return parts.join("\n");
      });

      // Batch embedding call
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textsToEmbed,
      });

      // Update each entry
      for (let j = 0; j < batch.length; j++) {
        const entry = batch[j];
        const embedding = response.data[j].embedding;

        const { error: updateError } = await supabase
          .from("corpus")
          .update({ embedding })
          .eq("id", entry.id);

        if (updateError) {
          console.error(`\nFailed to update ${entry.id}:`, updateError.message);
          failed++;
        } else {
          success++;
        }
      }

      console.log(`${batch.length} embedded`);

      // Small delay between batches to avoid rate limits
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`\nBatch error:`, err);
      failed += batch.length;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("Embedding Generation Complete");
  console.log("=".repeat(50));
  console.log(`Success: ${success}`);
  console.log(`Failed:  ${failed}`);
  console.log("=".repeat(50));
}

main().catch(console.error);
