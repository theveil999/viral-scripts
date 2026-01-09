/**
 * @fileoverview API route: models/[id]/hooks
 * @module api/models/[id]/hooks
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/services/hook-generation'

interface GenerateHooksRequest {
  count?: number
  hookTypes?: string[]
  corpusLimit?: number
  temperature?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as GenerateHooksRequest

    const result = await generateHooks(id, {
      count: body.count,
      hookTypes: body.hookTypes,
      corpusLimit: body.corpusLimit,
      temperature: body.temperature,
    })

    return NextResponse.json({
      hooks: result.hooks,
      stats: result.generation_stats,
    })
  } catch (error) {
    console.error('Hook generation error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
