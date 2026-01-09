/**
 * @fileoverview API route: models/[id]/batches
 * @module api/models/[id]/batches
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ScriptBatchRow {
  batch_id: string | null
  voice_fidelity_score: number | null
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params
    const supabase = createAdminClient()

    // Get distinct batches with their script counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scripts, error } = await (supabase
      .from('scripts') as any)
      .select('batch_id, voice_fidelity_score, created_at')
      .eq('model_id', modelId)
      .not('batch_id', 'is', null)
      .order('created_at', { ascending: false }) as { data: ScriptBatchRow[] | null; error: { message: string } | null }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by batch_id
    const batchMap = new Map<string, {
      batch_id: string
      created_at: string
      scripts_count: number
      total_fidelity: number
    }>()

    for (const script of scripts || []) {
      if (!script.batch_id) continue

      if (!batchMap.has(script.batch_id)) {
        batchMap.set(script.batch_id, {
          batch_id: script.batch_id,
          created_at: script.created_at,
          scripts_count: 0,
          total_fidelity: 0,
        })
      }

      const batch = batchMap.get(script.batch_id)!
      batch.scripts_count++
      batch.total_fidelity += script.voice_fidelity_score || 0
    }

    // Convert to array with avg fidelity
    const batches = Array.from(batchMap.values()).map(batch => ({
      batch_id: batch.batch_id,
      created_at: batch.created_at,
      scripts_count: batch.scripts_count,
      avg_fidelity: batch.scripts_count > 0
        ? Math.round(batch.total_fidelity / batch.scripts_count)
        : 0,
    }))

    return NextResponse.json({ batches })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
