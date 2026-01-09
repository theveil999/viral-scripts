/**
 * @fileoverview API route: extract-profile
 * @module api/extract-profile
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractVoiceProfile } from '@/lib/services/profile-extraction'
import { extractProfileSchema, validateRequest } from '@/lib/validations'
import { requireAuth } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Validate request body
    const body = await request.json()
    const validation = validateRequest(extractProfileSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { transcript, name, stage_name } = validation.data

    // Extract voice profile using Claude
    const voiceProfile = await extractVoiceProfile(transcript)

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
        name,
        stage_name: stage_name || null,
        transcript_raw: transcript,
        voice_profile: voiceProfile,
        archetype_tags: archetypeTags,
        explicitness_level: voiceProfile.spicy?.explicitness_level || null,
        boundaries: voiceProfile.boundaries || null,
        // user_id: authResult.id, // TODO: Uncomment when user_id column exists
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
