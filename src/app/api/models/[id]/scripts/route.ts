import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const status = searchParams.get('status')
    const batchId = searchParams.get('batch_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

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

    if (batchId) {
      query = query.eq('batch_id', batchId)
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
      limit,
      offset,
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
    const { id } = await params
    const body = await request.json()

    const { script_ids, status } = body as {
      script_ids: string[]
      status: 'generated' | 'approved' | 'posted' | 'archived'
    }

    if (!script_ids || !Array.isArray(script_ids) || script_ids.length === 0) {
      return NextResponse.json(
        { error: 'script_ids array is required' },
        { status: 400 }
      )
    }

    if (!['generated', 'approved', 'posted', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: generated, approved, posted, or archived' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Build update data
    const updateData: Record<string, unknown> = { status }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
    } else if (status === 'posted') {
      updateData.posted_at = new Date().toISOString()
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
