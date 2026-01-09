/**
 * Enrich corpus rows missing parasocial_levers using Claude API
 * Run with: npm run enrich-corpus
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const VALID_LEVERS = [
  "direct_address",
  "sexual_tension",
  "relatability",
  "vulnerability",
  "confession",
  "exclusivity",
  "challenge",
  "praise",
  "dominance",
  "playful_self_deprecation",
  "inside_reference",
  "aspiration",
  "pseudo_intimacy",
  "boyfriend_fantasy",
  "protector_dynamic",
] as const;

type ValidLever = (typeof VALID_LEVERS)[number];

interface CorpusRow {
  id: string;
  content: string;
  hook: string | null;
  hook_type: string | null;
  script_archetype: string | null;
}

interface LeverResult {
  id: string;
  parasocial_levers: string[];
}

const BATCH_SIZE = 10;
const DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateLevers(levers: string[]): ValidLever[] {
  return levers.filter((lever): lever is ValidLever =>
    VALID_LEVERS.includes(lever as ValidLever)
  );
}

async function enrichBatch(
  anthropic: Anthropic,
  rows: CorpusRow[]
): Promise<LeverResult[]> {
  const scriptsText = rows
    .map(
      (row, i) =>
        `[${i + 1}] ID: ${row.id}
Hook: ${row.hook || "N/A"}
Hook Type: ${row.hook_type || "N/A"}
Archetype: ${row.script_archetype || "N/A"}
Script: ${row.content.slice(0, 500)}${row.content.length > 500 ? "..." : ""}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are tagging viral scripts with parasocial levers.

VALID LEVERS (use only these exact strings):
- direct_address: Speaking directly to "you"
- sexual_tension: Suggestive, building desire
- relatability: Shared common experience ("Do you ever...")
- vulnerability: Sharing something personal/uncomfortable
- confession: Admitting something taboo/surprising
- exclusivity: Making viewer feel special/insider
- challenge: Provocative, creating intrigue ("If your girl doesn't...")
- praise: Good boy/girl dynamics
- dominance: Commanding energy, power dynamic
- playful_self_deprecation: Gentle self-mockery ("I need help")
- inside_reference: Callbacks to previous content
- aspiration: Glimpse of desirable lifestyle
- pseudo_intimacy: "Just between us" private feeling
- boyfriend_fantasy: Simulated romantic relationship
- protector_dynamic: "I'll take care of you" nurturing

For each script, identify 1-4 levers that are clearly present. Be conservative — only tag what's obviously there.

Return ONLY a JSON array (no markdown, no explanation):
[
  {"id": "uuid", "parasocial_levers": ["lever1", "lever2"]},
  ...
]

SCRIPTS TO TAG:

${scriptsText}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Could not parse JSON from response: ${content.text}`);
  }

  const results: LeverResult[] = JSON.parse(jsonMatch[0]);
  return results;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  if (!anthropicKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  console.log("🔍 Fetching corpus rows missing parasocial_levers...");

  // Fetch rows missing levers
  const { data: rows, error } = await supabase
    .from("corpus")
    .select("id, content, hook, hook_type, script_archetype")
    .or("parasocial_levers.is.null,parasocial_levers.eq.{}");

  if (error) {
    throw new Error(`Failed to fetch corpus: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
    console.log("✅ All corpus rows already have parasocial_levers!");
    return;
  }

  console.log(`📊 Found ${rows.length} rows to enrich\n`);

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = rows.slice(i, i + BATCH_SIZE);

    console.log(`⏳ Processing batch ${batchNum}/${totalBatches}...`);

    let results: LeverResult[] = [];
    let retries = 0;

    while (retries < 2) {
      try {
        results = await enrichBatch(anthropic, batch);
        break;
      } catch (err) {
        retries++;
        if (retries >= 2) {
          console.error(`   ❌ Batch ${batchNum} failed after retry:`, err);
          totalErrors += batch.length;
          continue;
        }
        console.log(`   ⚠️ Retry ${retries} for batch ${batchNum}...`);
        await sleep(1000);
      }
    }

    // Update each row
    for (const result of results) {
      const validLevers = validateLevers(result.parasocial_levers);

      if (validLevers.length === 0) {
        console.log(`   ⚠️ No valid levers for ${result.id}, skipping`);
        totalSkipped++;
        continue;
      }

      if (validLevers.length !== result.parasocial_levers.length) {
        const invalid = result.parasocial_levers.filter(
          (l) => !VALID_LEVERS.includes(l as ValidLever)
        );
        console.log(`   ⚠️ Invalid levers filtered out: ${invalid.join(", ")}`);
      }

      const { error: updateError } = await supabase
        .from("corpus")
        .update({ parasocial_levers: validLevers })
        .eq("id", result.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${result.id}:`, updateError);
        totalErrors++;
      } else {
        totalUpdated++;
      }
    }

    console.log(
      `   ✅ Batch ${batchNum}/${totalBatches} complete (${results.length} rows processed)`
    );

    // Rate limiting delay
    if (i + BATCH_SIZE < rows.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 ENRICHMENT SUMMARY");
  console.log("=".repeat(50));
  console.log(`   Total rows:    ${rows.length}`);
  console.log(`   Updated:       ${totalUpdated}`);
  console.log(`   Skipped:       ${totalSkipped}`);
  console.log(`   Errors:        ${totalErrors}`);
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Enrichment failed:", err);
    process.exit(1);
  });
