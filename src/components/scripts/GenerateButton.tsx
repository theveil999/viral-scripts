'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Zap, Clock } from 'lucide-react'
import GenerationModal from './GenerationModal'

interface GenerateButtonProps {
  modelId: string
  modelName: string
  onComplete: () => void
}

const hookCountOptions = [
  { value: 10, label: 'Quick (10)', description: 'Fast test batch' },
  { value: 21, label: 'Standard (21)', description: 'Recommended' },
  { value: 30, label: 'Full (30)', description: 'Maximum batch' },
]

const durationOptions = [
  { value: 'short', label: 'Short (~15s)', words: '40-60 words' },
  { value: 'medium', label: 'Medium (~30s)', words: '70-100 words' },
  { value: 'long', label: 'Long (~45s)', words: '100-120 words' },
]

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

export default function GenerateButton({
  modelId,
  modelName,
  onComplete,
}: GenerateButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [hookCount, setHookCount] = useState(21)
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium')

  const [modalOpen, setModalOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle')
  const [currentStage, setCurrentStage] = useState(0)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Simulate stage progression based on time
  useEffect(() => {
    if (status === 'generating') {
      // Stage timing approximations
      const stageTimes = [1000, 15000, 55000, 120000, 135000, 150000]

      const checkStage = () => {
        const elapsed = Date.now() - startTimeRef.current
        let stage = 0
        for (let i = 0; i < stageTimes.length; i++) {
          if (elapsed >= stageTimes[i]) {
            stage = i + 1
          }
        }
        setCurrentStage(Math.min(stage, 5))
      }

      const interval = setInterval(checkStage, 500)
      return () => clearInterval(interval)
    }
  }, [status])

  const startGeneration = async () => {
    setShowDropdown(false)
    setModalOpen(true)
    setStatus('generating')
    setCurrentStage(0)
    setResult(null)
    setError(null)
    setElapsedTime(0)

    startTimeRef.current = Date.now()

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 100)

    try {
      const res = await fetch(`/api/models/${modelId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hookCount,
          targetDuration: duration,
          saveToDatabase: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()

      setResult({
        scripts: data.scripts,
        batch_id: data.batch_id,
        total_time_ms: data.total_time_ms,
        total_tokens_used: data.total_tokens_used,
        estimated_cost_usd: data.estimated_cost_usd,
        final_script_count: data.scripts_generated,
        stages: data.stats,
      })
      setCurrentStage(6)
      setStatus('complete')
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setStatus('idle')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
      >
        <Sparkles className="w-4 h-4" />
        Generate
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-72 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Hook Count */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">
                  Number of Scripts
                </label>
                <div className="space-y-1">
                  {hookCountOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setHookCount(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        hookCount === opt.value
                          ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                          : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-zinc-500">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">
                  Script Duration
                </label>
                <div className="space-y-1">
                  {durationOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value as typeof duration)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        duration === opt.value
                          ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                          : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <span className="font-medium flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {opt.label}
                      </span>
                      <span className="text-xs text-zinc-500">{opt.words}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Action */}
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-700">
              <button
                onClick={startGeneration}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
              >
                <Zap className="w-4 h-4" />
                Generate {hookCount} Scripts
              </button>
              <p className="text-xs text-zinc-500 text-center mt-2">
                ~{Math.round((hookCount / 10) * 2.5)} minutes estimated
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Modal */}
      <GenerationModal
        isOpen={modalOpen}
        modelName={modelName}
        status={status}
        currentStage={currentStage}
        result={result || undefined}
        error={error || undefined}
        elapsedTime={elapsedTime}
        onClose={closeModal}
        onViewScripts={() => {
          closeModal()
        }}
      />
    </div>
  )
}
