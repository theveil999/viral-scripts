/**
 * @fileoverview API route: models/[id]/generate
 * @module api/models/[id]/generate
 */
import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/services/script-pipeline'
import { generatePipelineSchema, validateRequest } from '@/lib/validations'
import { requireAuth } from '@/lib/auth/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate request body (all fields optional for pipeline)
    const body = await request.json().catch(() => ({}))
    const validation = validateRequest(generatePipelineSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Run the full pipeline (cast to match service types)
    const result = await runPipeline(id, validation.data as Parameters<typeof runPipeline>[1])

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
