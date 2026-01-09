/**
 * Test Supabase connection
 * Run with: npm run test:db
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing environment variables. Make sure .env.local exists with:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL\n" +
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  console.log("🔌 Connecting to Supabase...");
  console.log(`   URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Query archetypes
  console.log("\n📊 Testing archetypes table...");
  const { data: archetypes, error: archetypesError } = await supabase
    .from("archetypes")
    .select("name, typical_energy_level")
    .order("name");

  if (archetypesError) {
    throw new Error(`Archetypes query failed: ${archetypesError.message}`);
  }

  console.log(`   ✅ Found ${archetypes.length} archetypes`);

  // Test 2: Query corpus count
  console.log("\n📚 Testing corpus table...");
  const { count: corpusCount, error: corpusError } = await supabase
    .from("corpus")
    .select("*", { count: "exact", head: true });

  if (corpusError) {
    throw new Error(`Corpus query failed: ${corpusError.message}`);
  }

  console.log(`   ✅ Found ${corpusCount} corpus entries`);

  // Test 3: Query parasocial levers
  console.log("\n🎭 Testing parasocial_levers table...");
  const { count: leversCount, error: leversError } = await supabase
    .from("parasocial_levers")
    .select("*", { count: "exact", head: true });

  if (leversError) {
    throw new Error(`Parasocial levers query failed: ${leversError.message}`);
  }

  console.log(`   ✅ Found ${leversCount} parasocial levers`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("✅ All connection tests passed!");
  console.log("=".repeat(50));
  console.log("\nDatabase state:");
  console.log(`   Archetypes:        ${archetypes.length}`);
  console.log(`   Corpus entries:    ${corpusCount}`);
  console.log(`   Parasocial levers: ${leversCount}`);

  return true;
}

// Run if called directly
testConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Connection test failed:");
    console.error(`   ${error.message}`);
    process.exit(1);
  });
