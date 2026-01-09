/**
 * Test full script generation pipeline
 * Run with: npm run test-pipeline
 *
 * This runs all 5 stages:
 * 1. Corpus Retrieval
 * 2. Hook Generation
 * 3. Script Expansion
 * 4. Voice Transformation
 * 5. Validation (with auto-revision)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { runPipeline } from '../src/lib/services/script-pipeline'

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║         VIRAL SCRIPTS - FULL PIPELINE TEST                           ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n')

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
    console.log('No models with embeddings found.')
    return
  }

  const model = models[0]
  console.log(`Model: ${model.name}`)
  console.log('═'.repeat(70))

  // Run full pipeline with 10 hooks for faster testing
  console.log('\nRunning full pipeline with 10 hooks...\n')

  const result = await runPipeline(model.id, {
    hookCount: 10,
    targetDuration: 'medium',
    minFidelityScore: 80,
    autoRevise: true,
    maxRevisionAttempts: 2,
  })

  // Show stage-by-stage results
  console.log('\n' + '═'.repeat(70))
  console.log('STAGE RESULTS')
  console.log('═'.repeat(70))

  console.log(`
┌──────────────────────────────────────────────────────────────────────┐
│ Stage 1: Corpus Retrieval                                            │
├──────────────────────────────────────────────────────────────────────┤
│   Matches: ${String(result.stages.corpus_retrieval.matches).padEnd(10)} Avg Similarity: ${(result.stages.corpus_retrieval.avg_similarity * 100).toFixed(1)}%
│   Time: ${result.stages.corpus_retrieval.time_ms}ms
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Stage 2: Hook Generation                                             │
├──────────────────────────────────────────────────────────────────────┤
│   Generated: ${result.stages.hook_generation.generated} hooks
│   Time: ${(result.stages.hook_generation.time_ms / 1000).toFixed(1)}s
│   Tokens: ${result.stages.hook_generation.tokens_used}
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Stage 3: Script Expansion                                            │
├──────────────────────────────────────────────────────────────────────┤
│   Expanded: ${result.stages.script_expansion.expanded} scripts
│   Avg Words: ${result.stages.script_expansion.avg_words}
│   Time: ${(result.stages.script_expansion.time_ms / 1000).toFixed(1)}s
│   Tokens: ${result.stages.script_expansion.tokens_used}
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Stage 4: Voice Transformation                                        │
├──────────────────────────────────────────────────────────────────────┤
│   Transformed: ${result.stages.voice_transformation.transformed} scripts
│   Avg Fidelity: ${result.stages.voice_transformation.avg_fidelity}%
│   Time: ${(result.stages.voice_transformation.time_ms / 1000).toFixed(1)}s
│   Tokens: ${result.stages.voice_transformation.tokens_used}
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Stage 5: Validation                                                  │
├──────────────────────────────────────────────────────────────────────┤
│   Passed: ${result.stages.validation.passed}
│   Revised: ${result.stages.validation.revised}
│   Failed: ${result.stages.validation.failed}
│   Avg Fidelity: ${result.stages.validation.avg_fidelity}%
│   Time: ${(result.stages.validation.time_ms / 1000).toFixed(1)}s
│   Tokens: ${result.stages.validation.tokens_used}
└──────────────────────────────────────────────────────────────────────┘`)

  // Show final scripts
  console.log('\n' + '═'.repeat(70))
  console.log('FINAL PASSING SCRIPTS')
  console.log('═'.repeat(70))

  for (let i = 0; i < result.scripts.length; i++) {
    const script = result.scripts[i]
    console.log(`
┌──────────────────────────────────────────────────────────────────────┐
│ Script ${i + 1} | Fidelity: ${script.voice_fidelity_score}% | ${script.hook_type}
├──────────────────────────────────────────────────────────────────────┤
│ Hook: "${script.hook.slice(0, 55)}${script.hook.length > 55 ? '...' : ''}"
├──────────────────────────────────────────────────────────────────────┤`)

    // Word wrap the script
    const words = script.script.split(' ')
    let line = '│ '
    for (const word of words) {
      if (line.length + word.length > 68) {
        console.log(line)
        line = '│ '
      }
      line += word + ' '
    }
    if (line.trim() !== '│') {
      console.log(line)
    }

    console.log(`├──────────────────────────────────────────────────────────────────────┤
│ Words: ${script.word_count} | Duration: ~${script.estimated_duration_seconds}s | Levers: ${script.parasocial_levers.slice(0, 3).join(', ')}
└──────────────────────────────────────────────────────────────────────┘`)
  }

  // Final summary
  console.log('\n' + '═'.repeat(70))
  console.log('PIPELINE SUMMARY')
  console.log('═'.repeat(70))

  const passRate = ((result.final_script_count / result.stages.hook_generation.generated) * 100).toFixed(0)

  console.log(`
  Total Time:        ${(result.total_time_ms / 1000).toFixed(1)}s
  Total Tokens:      ${result.total_tokens_used.toLocaleString()}

  Hooks Generated:   ${result.stages.hook_generation.generated}
  Scripts Passed:    ${result.final_script_count}
  Pass Rate:         ${passRate}%

  Avg Fidelity:      ${result.stages.validation.avg_fidelity}%
`)

  if (result.final_script_count >= result.stages.hook_generation.generated * 0.7) {
    console.log('✅ Pipeline completed successfully!')
  } else if (result.final_script_count >= result.stages.hook_generation.generated * 0.5) {
    console.log('⚠️  Pipeline completed with moderate pass rate.')
  } else {
    console.log('❌ Pipeline needs tuning - low pass rate.')
  }

  console.log('═'.repeat(70))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
