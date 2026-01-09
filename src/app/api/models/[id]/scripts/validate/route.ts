/**
 * @fileoverview API route: models/[id]/scripts/validate
 * @module api/models/[id]/scripts/validate
 */
import { NextRequest, NextResponse } from 'next/server'
import { validateScripts } from '@/lib/services/script-validation'
import type { TransformedScript } from '@/lib/services/voice-transformation'
import { validateScriptsSchema, validateRequest } from '@/lib/validations'
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
    const validation = validateRequest(validateScriptsSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Cast scripts to match service type (validation ensures required fields)
    const result = await validateScripts(id, validation.data.scripts as TransformedScript[])

    return NextResponse.json({
      validations: result.validations,
      summary: result.summary,
    })
  } catch (error) {
    console.error('Script validation error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Not found') || message.includes('no voice profile')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
