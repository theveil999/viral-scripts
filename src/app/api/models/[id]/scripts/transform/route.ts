/**
 * @fileoverview API route: models/[id]/scripts/transform
 * @module api/models/[id]/scripts/transform
 */
import { NextRequest, NextResponse } from 'next/server'
import { transformVoice } from '@/lib/services/voice-transformation'
import type { ExpandedScript } from '@/lib/services/script-expansion'

interface TransformScriptsRequest {
  scripts: ExpandedScript[]
  batchSize?: number
  temperature?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as TransformScriptsRequest

    if (!body.scripts || !Array.isArray(body.scripts) || body.scripts.length === 0) {
      return NextResponse.json(
        { error: 'scripts array is required and must not be empty' },
        { status: 400 }
      )
    }

    const result = await transformVoice(id, body.scripts, {
      batchSize: body.batchSize,
      temperature: body.temperature,
    })

    return NextResponse.json({
      transformed_scripts: result.transformed_scripts,
      stats: result.transformation_stats,
    })
  } catch (error) {
    console.error('Voice transformation error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Not found') || message.includes('no voice profile')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
