/**
 * @fileoverview API route: models/[id]/scripts
 * @module api/models/[id]/scripts
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/middleware'
import { getScriptsQuerySchema, updateScriptsStatusSchema, validateRequest } from '@/lib/validations'

export async function GET(
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
    const searchParams = request.nextUrl.searchParams

    // Validate query params
    const queryValidation = validateRequest(getScriptsQuerySchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      status: searchParams.get('status') || undefined,
      batch_id: searchParams.get('batch_id') || undefined,
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: queryValidation.error },
        { status: 400 }
      )
    }

    const { page, limit, status, batch_id } = queryValidation.data
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // Build query
    let query = supabase
      .from('scripts')
      .select('*', { count: 'exact' })
      .eq('model_id', id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (batch_id) {
      query = query.eq('batch_id', batch_id)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch scripts: ${error.message}`)
    }

    const total = count || 0
    const hasMore = offset + limit < total

    return NextResponse.json({
      scripts: data || [],
      total,
      hasMore,
      page,
      limit,
    })
  } catch (error) {
    console.error('Scripts list error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Update script status
export async function PATCH(
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
    const validation = validateRequest(updateScriptsStatusSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { script_ids, status } = validation.data

    const supabase = createAdminClient()

    // Build update data
    const updateData: Record<string, unknown> = { status }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('scripts') as any)
      .update(updateData)
      .eq('model_id', id)
      .in('id', script_ids)
      .select('id, status')

    if (error) {
      throw new Error(`Failed to update scripts: ${error.message}`)
    }

    return NextResponse.json({
      updated: data?.length || 0,
      scripts: data,
    })
  } catch (error) {
    console.error('Scripts update error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
