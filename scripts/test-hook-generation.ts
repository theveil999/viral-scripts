/**
 * Test hook generation pipeline
 * Run with: npm run test-hooks
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { generateHooks } from '../src/lib/services/hook-generation'

async function main() {
  console.log('Testing Hook Generation Pipeline\
')
  console.log('â•'.repeat(60))

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
    console.log('Create a model first and ensure it has an embedding.')
    return
  }

  const model = models[0]
  console.log(`\
Generating hooks for: ${model.name}`)
  console.log('â•'.repeat(60))
  console.log('\
This may take 15-30 seconds...\
')

  const startTime = Date.now()

  try {
    const result = await generateHooks(model.id, {
      count: 30,
      temperature: 0.9,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('â•'.repeat(60))
    console.log('GENERATION STATS')
    console.log('â•'.repeat(60))
    console.log(`  Requested: ${result.generation_stats.requested}`)
    console.log(`  Generated: ${result.generation_stats.generated}`)
    console.log(`  Time: ${duration}s`)
    console.log(`  Tokens used: ${result.generation_stats.tokens_used}`)
    console.log('\
  By Type:')
    Object.entries(result.generation_stats.by_type)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`)
      })

    // Group hooks by type for display
    const hooksByType: Record<string, typeof result.hooks> = {}
    for (const hook of result.hooks) {
      if (!hooksByType[hook.hook_type]) {
        hooksByType[hook.hook_type] = []
      }
      hooksByType[hook.hook_type].push(hook)
    }

    console.log('\
' + 'â•'.repeat(60))
    console.log('GENERATED HOOKS')
    console.log('â•'.repeat(60))

    for (const [type, hooks] of Object.entries(hooksByType).sort()) {
      console.log(`\
ðŸ“Œ ${type.toUpperCase()} (${hooks.length})`)
      console.log('â”€'.repeat(40))

      for (const hook of hooks) {
        console.log(`\
  "${hook.hook}"`)
        console.log(`  â””â”€ Levers: ${hook.parasocial_levers.join(', ') || 'general'}`)
        console.log(`  â””â”€ Why: ${hook.why_it_works}`)
      }
    }

    console.log('\
' + 'â•'.repeat(60))
    console.log('Test completed successfully!')

  } catch (error) {
    console.error('Hook generation failed:', error)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
