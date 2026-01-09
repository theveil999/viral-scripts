'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Filter, Loader2, FileText, Sparkles } from 'lucide-react'
import ScriptCard from './ScriptCard'

interface Script {
  id: string
  hook: string | null
  hook_type: string | null
  content: string
  word_count: number | null
  estimated_duration: number | null
  voice_fidelity_score: number | null
  status: string
  batch_id: string | null
  created_at: string
}

interface Batch {
  batch_id: string
  created_at: string
  scripts_count: number
  avg_fidelity: number
}

interface ScriptListProps {
  modelId: string
  refreshTrigger?: number
  onGenerateClick?: () => void
}

const statusOptions = [
  { value: '', label: 'All Scripts' },
  { value: 'draft', label: 'Drafts' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'archived', label: 'Archived' },
]

export default function ScriptList({ modelId, refreshTrigger, onGenerateClick }: ScriptListProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const limit = 20

  // Fetch batches for filter dropdown
  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/models/${modelId}/batches`)
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches || [])
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err)
    }
  }, [modelId])

  // Fetch scripts
  const fetchScripts = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setOffset(0)
      }

      const currentOffset = loadMore ? offset : 0
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      })

      if (statusFilter) params.set('status', statusFilter)
      if (batchFilter) params.set('batch_id', batchFilter)

      const res = await fetch(`/api/models/${modelId}/scripts?${params}`)

      if (!res.ok) {
        throw new Error('Failed to fetch scripts')
      }

      const data = await res.json()

      if (loadMore) {
        setScripts(prev => [...prev, ...(data.scripts || [])])
      } else {
        setScripts(data.scripts || [])
      }

      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
      setOffset(currentOffset + limit)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [modelId, statusFilter, batchFilter, offset])

  // Initial fetch
  useEffect(() => {
    fetchScripts()
    fetchBatches()
  }, [modelId, statusFilter, batchFilter, refreshTrigger])

  // Handle status change
  const handleStatusChange = async (scriptId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // Optimistic update
        setScripts(prev =>
          prev.map(s =>
            s.id === scriptId ? { ...s, status: newStatus } : s
          )
        )
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  // Handle copy
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading && scripts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchScripts()}
          className="mt-4 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {batches.length > 0 && (
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {new Date(batch.created_at).toLocaleDateString()} ({batch.scripts_count} scripts)
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-sm text-zinc-500">
          Showing {scripts.length} of {total} scripts
        </div>
      </div>

      {/* Empty State */}
      {scripts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
        >
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No scripts yet</h3>
          <p className="text-zinc-500 mb-6">
            Generate your first batch of viral scripts!
          </p>
          {onGenerateClick && (
            <button
              onClick={onGenerateClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Generate Scripts
            </button>
          )}
        </motion.div>
      )}

      {/* Script Grid */}
      {scripts.length > 0 && (
        <div className="grid gap-4">
          {scripts.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ScriptCard
                script={script}
                onStatusChange={handleStatusChange}
                onCopy={handleCopy}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchScripts(true)}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
