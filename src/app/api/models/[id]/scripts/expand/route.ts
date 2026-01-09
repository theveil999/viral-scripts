/**
 * @fileoverview API route: models/[id]/scripts/expand
 * @module api/models/[id]/scripts/expand
 */
import { NextRequest, NextResponse } from 'next/server'
import { expandScripts } from '@/lib/services/script-expansion'
import type { GeneratedHook } from '@/lib/services/hook-generation'
import { expandScriptsSchema, validateRequest } from '@/lib/validations'
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
    
    // Validate request body
    const body = await request.json()
    const validation = validateRequest(expandScriptsSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { hooks, targetDuration, corpusLimit } = validation.data

    // Schema validates all required GeneratedHook fields with correct types
    const result = await expandScripts(id, hooks as GeneratedHook[], {
      targetDuration,
      corpusLimit,
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
