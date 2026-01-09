/**
 * Test voice transformation pipeline (Stage 4)
 * Run with: npm run test-transform
 *
 * This test runs the full pipeline:
 * 1. Generate hooks
 * 2. Expand hooks to scripts
 * 3. Transform scripts with Claude Opus for voice fidelity
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { generateHooks } from '../src/lib/services/hook-generation'
import { expandScripts } from '../src/lib/services/script-expansion'
import { transformVoice } from '../src/lib/services/voice-transformation'

async function main() {
  console.log('Testing Voice Transformation Pipeline (Stage 4)\
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
  const totalStartTime = Date.now()
  console.log(`\
Model: ${model.name}`)
  console.log('â•'.repeat(70))

  // Step 1: Generate 5 hooks (smaller batch for testing)
  console.log('\
ðŸ“Œ STEP 1: Generating hooks...\
')
  const hookStartTime = Date.now()

  const hookResult = await generateHooks(model.id, {
    count: 5,
    temperature: 0.9,
  })

  const hookDuration = ((Date.now() - hookStartTime) / 1000).toFixed(1)
  console.log(`Generated ${hookResult.hooks.length} hooks in ${hookDuration}s`)

  // Show hooks
  console.log('\
Hooks:')
  hookResult.hooks.forEach((hook, i) => {
    console.log(`  ${i + 1}. [${hook.hook_type}] "${hook.hook.slice(0, 60)}${hook.hook.length > 60 ? '...' : ''}"`)
  })

  // Step 2: Expand into scripts
  console.log('\
' + 'â•'.repeat(70))
  console.log('ðŸ“ STEP 2: Expanding hooks into scripts...')
  console.log('(Using Claude Sonnet for expansion)\
')

  const expandStartTime = Date.now()

  const expansionResult = await expandScripts(model.id, hookResult.hooks, {
    targetDuration: 'medium',
    corpusLimit: 10,
  })

  const expandDuration = ((Date.now() - expandStartTime) / 1000).toFixed(1)
  console.log(`Expanded ${expansionResult.scripts.length} scripts in ${expandDuration}s`)
  console.log(`Avg word count: ${expansionResult.expansion_stats.avg_word_count}`)

  // Step 3: Voice Transformation
  console.log('\
' + 'â•'.repeat(70))
  console.log('ðŸŽ­ STEP 3: Transforming voice with Claude Opus...')
  console.log('(This is the quality-critical stage for 95%+ voice fidelity)')
  console.log('(May take 60-120 seconds)\
')

  const transformStartTime = Date.now()

  const transformResult = await transformVoice(model.id, expansionResult.scripts, {
    batchSize: 3,
    temperature: 0.7,
  })

  const transformDuration = ((Date.now() - transformStartTime) / 1000).toFixed(1)

  // Show transformation stats
  console.log('â•'.repeat(70))
  console.log('TRANSFORMATION STATS')
  console.log('â•'.repeat(70))
  console.log(`  Scripts transformed: ${transformResult.transformation_stats.scripts_transformed}`)
  console.log(`  Avg voice fidelity: ${transformResult.transformation_stats.avg_voice_fidelity}%`)
  console.log(`  Avg AI tells removed: ${transformResult.transformation_stats.avg_ai_tells_removed}`)
  console.log(`  Avg voice elements added: ${transformResult.transformation_stats.avg_voice_elements_added}`)
  console.log(`  Transformation time: ${transformDuration}s`)
  console.log(`  Tokens used: ${transformResult.transformation_stats.tokens_used}`)

  // Show before/after for each script
  console.log('\
' + 'â•'.repeat(70))
  console.log('BEFORE/AFTER COMPARISON')
  console.log('â•'.repeat(70))

  for (let i = 0; i < transformResult.transformed_scripts.length; i++) {
    const transformed = transformResult.transformed_scripts[i]
    const original = expansionResult.scripts[i]

    console.log(`\
â”Œ${'â”€'.repeat(68)}â”`)
    console.log(`â”‚ Script ${i + 1}: Voice Fidelity ${transformed.voice_fidelity_score}%`)
    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)

    // Original
    console.log(`â”‚ BEFORE (Sonnet):`)
    const originalWords = original.script.split(' ')
    let line = 'â”‚   '
    for (const word of originalWords.slice(0, 30)) {
      if (line.length + word.length > 66) {
        console.log(line)
        line = 'â”‚   '
      }
      line += word + ' '
    }
    if (originalWords.length > 30) line += '...'
    console.log(line)

    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)

    // Transformed
    console.log(`â”‚ AFTER (Opus):`)
    const transformedWords = transformed.transformed_script.split(' ')
    line = 'â”‚   '
    for (const word of transformedWords.slice(0, 30)) {
      if (line.length + word.length > 66) {
        console.log(line)
        line = 'â”‚   '
      }
      line += word + ' '
    }
    if (transformedWords.length > 30) line += '...'
    console.log(line)

    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)

    // Changes
    console.log(`â”‚ Changes made:`)
    for (const change of transformed.changes_made.slice(0, 3)) {
      console.log(`â”‚   â€¢ ${change.slice(0, 60)}${change.length > 60 ? '...' : ''}`)
    }

    console.log(`â”œ${'â”€'.repeat(68)}â”¤`)

    // AI tells removed
    if (transformed.ai_tells_removed.length > 0) {
      console.log(`â”‚ AI tells removed: ${transformed.ai_tells_removed.join(', ')}`)
    } else {
      console.log(`â”‚ AI tells removed: none detected`)
    }

    // Voice elements added
    if (transformed.voice_elements_added.length > 0) {
      console.log(`â”‚ Voice elements: ${transformed.voice_elements_added.slice(0, 5).join(', ')}`)
    }

    console.log(`â””${'â”€'.repeat(68)}â”˜`)
  }

  // Final summary
  const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(1)
  console.log('\
' + 'â•'.repeat(70))
  console.log('PIPELINE SUMMARY')
  console.log('â•'.repeat(70))
  console.log(`  Stage 1 (Hooks):       ${hookDuration}s`)
  console.log(`  Stage 2 (Expansion):   ${expandDuration}s`)
  console.log(`  Stage 3 (Transform):   ${transformDuration}s`)
  console.log(`  Total:                 ${totalDuration}s`)
  console.log('')
  console.log(`  Voice fidelity target: 95%`)
  console.log(`  Achieved avg:          ${transformResult.transformation_stats.avg_voice_fidelity}%`)

  if (transformResult.transformation_stats.avg_voice_fidelity >= 90) {
    console.log('\
âœ… Voice transformation successful!')
  } else {
    console.log('\
âš ï¸  Voice fidelity below target. Consider adjusting voice profile or samples.')
  }

  console.log('â•'.repeat(70))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
