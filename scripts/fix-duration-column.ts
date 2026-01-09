/**
 * Quick fix script to rename duration_estimate to duration_seconds
 * Run with: npx tsx scripts/fix-duration-column.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDurationColumn() {
  console.log('Checking and fixing duration column...')

  // Try to rename duration_estimate to duration_seconds
  const { error: renameError } = await supabase.rpc('exec_sql', {
    sql: `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'scripts' AND column_name = 'duration_estimate'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'scripts' AND column_name = 'duration_seconds'
        ) THEN
          ALTER TABLE scripts RENAME COLUMN duration_estimate TO duration_seconds;
          RAISE NOTICE 'Renamed duration_estimate to duration_seconds';
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'scripts' AND column_name = 'duration_seconds'
        ) THEN
          ALTER TABLE scripts ADD COLUMN duration_seconds INTEGER;
          RAISE NOTICE 'Added duration_seconds column';
        ELSE
          RAISE NOTICE 'duration_seconds column already exists';
        END IF;
      END $$;
    `
  })

  if (renameError) {
    // If RPC doesn't exist, we need to do this via Supabase dashboard
    console.log('\n⚠️  Cannot run SQL directly via API.')
    console.log('\n📋 Please run this SQL in your Supabase Dashboard SQL Editor:\n')
    console.log(`
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- Run this SQL:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scripts' AND column_name = 'duration_estimate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scripts' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE scripts RENAME COLUMN duration_estimate TO duration_seconds;
  END IF;
END $$;

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE scripts ALTER COLUMN status SET DEFAULT 'draft';
    `)
    return
  }

  console.log('✅ Duration column fixed!')
}

fixDurationColumn().catch(console.error)

