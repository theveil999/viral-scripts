import { NextRequest, NextResponse } from 'next/server'
import { validateScripts } from '@/lib/services/script-validation'
import type { TransformedScript } from '@/lib/services/voice-transformation'

interface ValidateScriptsRequest {
  scripts: TransformedScript[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as ValidateScriptsRequest

    if (!body.scripts || !Array.isArray(body.scripts) || body.scripts.length === 0) {
      return NextResponse.json(
        { error: 'scripts array is required and must not be empty' },
        { status: 400 }
      )
    }

    const result = await validateScripts(id, body.scripts)

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
