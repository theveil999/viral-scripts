/**
 * @fileoverview API route: models/[id]/scripts/transform
 * @module api/models/[id]/scripts/transform
 */
import { NextRequest, NextResponse } from 'next/server'
import { transformVoice } from '@/lib/services/voice-transformation'
import type { ExpandedScript } from '@/lib/services/script-expansion'
import { transformScriptsSchema, validateRequest } from '@/lib/validations'
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
    const validation = validateRequest(transformScriptsSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Cast scripts to match service type (validation ensures required fields)
    const result = await transformVoice(id, validation.data.scripts as ExpandedScript[])

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
