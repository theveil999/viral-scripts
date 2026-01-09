/**
 * Test script expansion pipeline
 * Run with: npm run test-expansion
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { generateHooks } from '../src/lib/services/hook-generation'
import { expandScripts } from '../src/lib/services/script-expansion'

async function main() {
  console.log('Testing Script Expansion Pipeline\
')
  console.log('â•'.repeat(70))

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find a model with an embedding
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, name')
    .not('embedding', 'is', null)
    .limit(1)

  if (modelsError || !models?.length) {
    console.log('\
No models with embeddings found.')
    return
  }

  const model = models[0]
  console.log(`\
Model: ${model.name}`)
  console.log('â•'.repeat(70))

  // Step 1: Generate 10 hooks
  console.log('\
ðŸ“Œ STEP 1: Generating 10 hooks...\
')
  const hookStartTime = Date.now()

  const hookResult = await generateHooks(model.id, {
    count: 10,
    temperature: 0.9,
  })

  const hookDuration = ((Date.now() - hookStartTime) / 1000).toFixed(1)
  console.log(`Generated ${hookResult.hooks.length} hooks in ${hookDuration}s`)

  // Show hooks
  console.log('\
Hooks to expand:')
  hookResult.hooks.forEach((hook, i) => {
    console.log(`  ${i + 1}. [${hook.hook_type}] "${hook.hook}"`)
  })

  // Step 2: Expand into scripts
  console.log('\
' + 'â•'.repeat(70))
  console.log('ðŸ“ STEP 2: Expanding hooks into full scripts...')
  console.log('(This may take 30-60 seconds)\
')

  const expandStartTime = Date.now()

  const expansionResult = await expandScripts(model.id, hookResult.hooks, {
    targetDuration: 'medium',
    corpusLimit: 10,
  })

  const expandDuration = ((Date.now() - expandStartTime) / 1000).toFixed(1)

  // Show stats
  console.log('â•'.repeat(70))
  console.log('EXPANSION STATS')
  console.log('â•'.repeat(70))
  console.log(`  Hooks received: ${expansionResult.expansion_stats.hooks_received}`)
  console.log(`  Scripts generated: ${expansionResult.expansion_stats.scripts_generated}`)
  console.log(`  Avg word count: ${expansionResult.expansion_stats.avg_word_count}`)
  console.log(`  Avg duration: ${expansionResult.expansion_stats.avg_duration_seconds}s`)
  console.log(`  Generation time: ${expandDuration}s`)
  console.log(`  Tokens used: ${expansionResult.expansion_stats.tokens_used}`)

  // Show each expanded script
  console.log('\
' + 'â•'.repeat(70))
  console.log('EXPANDED SCRIPTS')
  console.log('â•'.repeat(70))

  for (const script of expansionResult.scripts) {
    console.log(`\
â”Œ${'â”€'.repeat(68)}â”`)
    console.log(`â”‚ Script ${script.hook_index + 1}: ${script.hook.slice(0, 50)}${script.hook.length > 50 ? '...' : ''}`)
    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)
    console.log(`â”‚ Word count: ${script.word_count} | Duration: ~${script.estimated_duration_seconds}s`)
    console.log(`â”‚ Levers: ${script.parasocial_levers_used.join(', ') || 'general'}`)
    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)

    // Print script with word wrap
    const words = script.script.split(' ')
    let line = 'â”‚ '
    for (const word of words) {
      if (line.length + word.length > 68) {
        console.log(line)
        line = 'â”‚ '
      }
      line += word + ' '
    }
    if (line.trim() !== 'â”‚') {
      console.log(line)
    }

    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)
    console.log(`â”‚ Structure:`)
    console.log(`â”‚   Hook: ${script.structure_breakdown.hook?.slice(0, 55)}...`)
    console.log(`â”‚   Tension: ${script.structure_breakdown.tension?.slice(0, 50)}...`)
    console.log(`â”‚   Payload: ${script.structure_breakdown.payload?.slice(0, 50)}...`)
    console.log(`â”‚   Closer: ${script.structure_breakdown.closer?.slice(0, 55)}...`)

    if (script.validation_issues?.length) {
      console.log(`â”œ${'â”€'.repeat(68)}â”¤`)
      console.log(`â”‚ âš ï¸  Issues: ${script.validation_issues.join(', ')}`)
    }

    console.log(`â””${'â”€'.repeat(68)}â”˜`)
  }

  console.log('\
' + 'â•'.repeat(70))
  console.log('Test completed successfully!')
  console.log(`Total time: ${((Date.now() - hookStartTime) / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
