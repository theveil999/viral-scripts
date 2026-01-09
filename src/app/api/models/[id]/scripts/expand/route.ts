/**
 * @fileoverview API route: models/[id]/scripts/expand
 * @module api/models/[id]/scripts/expand
 */
import { NextRequest, NextResponse } from 'next/server'
import { expandScripts } from '@/lib/services/script-expansion'
import type { GeneratedHook } from '@/lib/services/hook-generation'
import type { TargetDuration } from '@/lib/prompts/script-expansion'

interface ExpandScriptsRequest {
  hooks: GeneratedHook[]
  targetDuration?: TargetDuration
  corpusLimit?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as ExpandScriptsRequest

    if (!body.hooks || !Array.isArray(body.hooks) || body.hooks.length === 0) {
      return NextResponse.json(
        { error: 'hooks array is required and must not be empty' },
        { status: 400 }
      )
    }

    const result = await expandScripts(id, body.hooks, {
      targetDuration: body.targetDuration,
      corpusLimit: body.corpusLimit,
    })

    return NextResponse.json({
      scripts: result.scripts,
      stats: result.expansion_stats,
    })
  } catch (error) {
    console.error('Script expansion error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
