import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/services/script-pipeline'
import type { TargetDuration } from '@/lib/prompts/script-expansion'

interface GenerateScriptsRequest {
  hookCount?: number
  targetDuration?: TargetDuration
  minFidelityScore?: number
  autoRevise?: boolean
  saveToDatabase?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as GenerateScriptsRequest

    // Run the full pipeline
    const result = await runPipeline(id, {
      hookCount: body.hookCount,
      targetDuration: body.targetDuration,
      minFidelityScore: body.minFidelityScore,
      autoRevise: body.autoRevise,
    })

    return NextResponse.json({
      scripts: result.scripts,
      stats: result.stages,
      total_time_ms: result.total_time_ms,
      total_tokens_used: result.total_tokens_used,
      scripts_generated: result.final_script_count,
    })
  } catch (error) {
    console.error('Pipeline error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Not found') || message.includes('no voice profile')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
