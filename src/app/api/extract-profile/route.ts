/**
 * @fileoverview API route: extract-profile
 * @module api/extract-profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractVoiceProfile } from '@/lib/services/profile-extraction'

interface ExtractProfileRequest {
  transcript: string
  name: string
  stage_name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExtractProfileRequest

    // Validate request
    if (!body.transcript || typeof body.transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'transcript is required' },
        { status: 400 }
      )
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    if (body.transcript.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: 'transcript must be at least 100 characters' },
        { status: 400 }
      )
    }

    // Extract voice profile using Claude
    const voiceProfile = await extractVoiceProfile(body.transcript)

    // Insert into database
    const supabase = createAdminClient()

    // Build archetype_tags from assignment
    const archetypeTags = [
      voiceProfile.archetype_assignment.primary,
      voiceProfile.archetype_assignment.secondary,
    ].filter((tag): tag is string => Boolean(tag))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: model, error: insertError } = await (supabase
      .from('models') as any)
      .insert({
        name: body.name,
        stage_name: body.stage_name || null,
        transcript_raw: body.transcript,
        voice_profile: voiceProfile,
        archetype_tags: archetypeTags,
        explicitness_level: voiceProfile.spicy?.explicitness_level || null,
        boundaries: voiceProfile.boundaries || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { success: false, error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      model_id: model.id,
      voice_profile: voiceProfile,
    })
  } catch (error) {
    console.error('Profile extraction error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const rawResponse = (error as { rawResponse?: string }).rawResponse

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(rawResponse && { raw_response: rawResponse }),
      },
      { status: 500 }
    )
  }
}
