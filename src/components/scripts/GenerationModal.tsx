'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  Anchor,
  FileText,
  Sparkles,
  ShieldCheck,
  Database,
  Clock,
  Coins,
  Zap,
} from 'lucide-react'

interface PipelineResult {
  scripts: Array<{
    id?: string
    hook: string
    script: string
    voice_fidelity_score: number
  }>
  batch_id?: string
  total_time_ms: number
  total_tokens_used: number
  estimated_cost_usd?: number
  final_script_count: number
  stages: {
    hook_generation: { generated: number }
    validation: { avg_fidelity: number }
  }
}

interface GenerationModalProps {
  isOpen: boolean
  modelName: string
  status: 'idle' | 'generating' | 'complete' | 'error'
  currentStage?: number
  result?: PipelineResult
  error?: string
  elapsedTime?: number
  onClose: () => void
  onViewScripts?: () => void
}

const stages = [
  { icon: BookOpen, label: 'Finding viral examples...', color: 'text-purple-400' },
  { icon: Anchor, label: 'Creating hooks...', color: 'text-blue-400' },
  { icon: FileText, label: 'Writing full scripts...', color: 'text-cyan-400' },
  { icon: Sparkles, label: 'Applying her voice...', color: 'text-pink-400' },
  { icon: ShieldCheck, label: 'Quality checking...', color: 'text-emerald-400' },
  { icon: Database, label: 'Saving to database...', color: 'text-amber-400' },
]

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}

export default function GenerationModal({
  isOpen,
  modelName,
  status,
  currentStage = 0,
  result,
  error,
  elapsedTime = 0,
  onClose,
  onViewScripts,
}: GenerationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={status !== 'generating' ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {status === 'generating'
                      ? 'Generating Scripts...'
                      : status === 'complete'
                        ? 'Generation Complete!'
                        : status === 'error'
                          ? 'Generation Failed'
                          : 'Script Generation'}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {modelName}
                  </p>
                </div>
                {status !== 'generating' && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Generating State */}
                {status === 'generating' && (
                  <div className="space-y-3">
                    {stages.map((stage, index) => {
                      const Icon = stage.icon
                      const isActive = index === currentStage
                      const isComplete = index < currentStage
                      const isPending = index > currentStage

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-zinc-800'
                              : isComplete
                                ? 'bg-zinc-800/50'
                                : 'opacity-40'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isComplete
                                ? 'bg-emerald-900/50'
                                : isActive
                                  ? 'bg-zinc-700'
                                  : 'bg-zinc-800'
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            ) : (
                              <Icon className={`w-4 h-4 ${stage.color}`} />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isActive
                                ? 'text-zinc-100'
                                : isComplete
                                  ? 'text-zinc-400'
                                  : 'text-zinc-500'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </motion.div>
                      )
                    })}

                    {/* Elapsed Time */}
                    <div className="flex items-center justify-center gap-2 pt-4 text-zinc-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatTime(elapsedTime)} elapsed
                      </span>
                    </div>
                  </div>
                )}

                {/* Complete State */}
                {status === 'complete' && result && (
                  <div className="space-y-6">
                    {/* Success Icon */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-emerald-900/30 rounded-full mb-4"
                      >
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-zinc-100">
                        {result.final_script_count} Scripts Generated
                      </h3>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          {result.stages?.validation?.avg_fidelity || 0}%
                        </div>
                        <div className="text-xs text-zinc-500">Avg Fidelity</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {formatTime(result.total_time_ms)}
                        </div>
                        <div className="text-xs text-zinc-500">Total Time</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {result.stages?.hook_generation?.generated || 0}
                        </div>
                        <div className="text-xs text-zinc-500">Hooks Created</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-amber-400">
                          ${result.estimated_cost_usd?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-zinc-500">Est. Cost</div>
                      </div>
                    </div>

                    {/* Batch ID */}
                    {result.batch_id && (
                      <div className="text-center text-xs text-zinc-500">
                        Batch: {result.batch_id}
                      </div>
                    )}
                  </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/30 rounded-full mb-4">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                      Something went wrong
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {error || 'Failed to generate scripts. Please try again.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {status !== 'generating' && (
                <div className="flex items-center gap-3 p-5 border-t border-zinc-800">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {status === 'complete' && onViewScripts && (
                    <button
                      onClick={() => {
                        onViewScripts()
                        onClose()
                      }}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      View Scripts
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
