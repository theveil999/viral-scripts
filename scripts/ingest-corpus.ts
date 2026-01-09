import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

// Load environment variables
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface TSVRow {
  id: string
  text: string
  hook: string
  duration_seconds: string
  word_count: string
  creator: string
  hook_type: string
  script_archetype: string
  parasocial_levers: string
  quality_score: string
}

interface CorpusInsert {
  content: string
  creator: string | null
  duration_seconds: number | null
  hook: string | null
  hook_type: string | null
  script_archetype: string | null
  parasocial_levers: string[] | null
  quality_score: number | null
  is_active: boolean
}

// Filler text patterns to skip
const SKIP_PATTERNS = [
  /^thanks for watching/i,
  /^subscribe/i,
  /^like and subscribe/i,
  /^follow me/i,
]

function shouldSkip(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return 'Empty content'
  }
  if (content.trim().length < 20) {
    return `Too short (${content.trim().length} chars)`
  }
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(content.trim())) {
      return `Matches skip pattern: ${pattern}`
    }
  }
  return null
}

function parseRow(row: TSVRow): CorpusInsert | null {
  const skipReason = shouldSkip(row.text)
  if (skipReason) {
    return null
  }

  // Parse parasocial_levers from pipe-delimited string to array
  const levers = row.parasocial_levers
    ? row.parasocial_levers.split('|').map(l => l.trim()).filter(Boolean)
    : null

  // Parse numeric fields
  const durationSeconds = row.duration_seconds
    ? parseInt(row.duration_seconds, 10)
    : null
  const qualityScore = row.quality_score
    ? parseFloat(row.quality_score)
    : 0.7

  return {
    content: row.text.trim(),
    creator: row.creator?.trim() || null,
    duration_seconds: isNaN(durationSeconds!) ? null : durationSeconds,
    hook: row.hook?.trim() || null,
    hook_type: row.hook_type?.trim() || null,
    script_archetype: row.script_archetype?.trim() || null,
    parasocial_levers: levers && levers.length > 0 ? levers : null,
    quality_score: isNaN(qualityScore) ? 0.7 : qualityScore,
    is_active: true,
  }
}

async function main() {
  console.log('Corpus Ingestion Starting...\
')

  // Read TSV file
  const tsvPath = path.join(__dirname, '../docs/corpus_cleaned.tsv')
  const fileContent = fs.readFileSync(tsvPath, 'utf-8')

  // Parse TSV
  const { data, errors } = Papa.parse<TSVRow>(fileContent, {
    header: true,
    delimiter: '\	',
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    console.error('Parse errors:', errors)
  }

  console.log(`Parsed ${data.length} rows from TSV\
`)

  // Process rows
  const toInsert: CorpusInsert[] = []
  const skipped: { row: number; reason: string }[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const skipReason = shouldSkip(row.text)

    if (skipReason) {
      skipped.push({ row: i + 2, reason: skipReason }) // +2 for header and 1-indexing
      continue
    }

    const parsed = parseRow(row)
    if (parsed) {
      toInsert.push(parsed)
    }
  }

  console.log(`Valid rows to insert: ${toInsert.length}`)
  console.log(`Skipped rows: ${skipped.length}\
`)

  if (skipped.length > 0 && skipped.length <= 20) {
    console.log('Skipped rows:')
    for (const s of skipped) {
      console.log(`  Row ${s.row}: ${s.reason}`)
    }
    console.log()
  }

  // Batch insert (Supabase handles batching internally)
  const BATCH_SIZE = 100
  let inserted = 0
  let errorCount = 0

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)

    const { data: insertedData, error } = await supabase
      .from('corpus')
      .insert(batch)
      .select('id')

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      errorCount += batch.length
    } else {
      inserted += insertedData?.length || batch.length
      process.stdout.write(`\\rInserted: ${inserted}/${toInsert.length}`)
    }
  }

  console.log('\
')

  // Summary
  console.log('=' .repeat(40))
  console.log('Corpus Ingestion Summary')
  console.log('=' .repeat(40))
  console.log(`Total TSV rows:  ${data.length}`)
  console.log(`Inserted:        ${inserted}`)
  console.log(`Skipped:         ${skipped.length}`)
  console.log(`Errors:          ${errorCount}`)
  console.log('=' .repeat(40))

  // Verify count in database
  const { count } = await supabase
    .from('corpus')
    .select('*', { count: 'exact', head: true })

  console.log(`\
Total corpus entries in database: ${count}`)
}

main().catch(console.error)
