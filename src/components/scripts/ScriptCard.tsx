'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Check,
  ChevronDown,
  MoreVertical,
  Clock,
  FileText,
  Sparkles,
  Archive,
  CheckCircle,
  Send,
} from 'lucide-react'

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

interface ScriptCardProps {
  script: Script
  onStatusChange: (id: string, status: string) => void
  onCopy: (text: string) => void
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-zinc-700', text: 'text-zinc-300', dot: 'bg-zinc-400' },
  approved: { bg: 'bg-emerald-900/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  posted: { bg: 'bg-blue-900/50', text: 'text-blue-300', dot: 'bg-blue-400' },
  archived: { bg: 'bg-red-900/50', text: 'text-red-300', dot: 'bg-red-400' },
}

const hookTypeColors: Record<string, string> = {
  bold_statement: 'bg-purple-900/50 text-purple-300',
  question: 'bg-blue-900/50 text-blue-300',
  challenge: 'bg-orange-900/50 text-orange-300',
  fantasy: 'bg-pink-900/50 text-pink-300',
  relatable: 'bg-green-900/50 text-green-300',
  advice: 'bg-cyan-900/50 text-cyan-300',
  confession: 'bg-red-900/50 text-red-300',
  roleplay: 'bg-violet-900/50 text-violet-300',
  storytime: 'bg-amber-900/50 text-amber-300',
  hot_take: 'bg-rose-900/50 text-rose-300',
}

export default function ScriptCard({ script, onStatusChange, onCopy }: ScriptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const fidelityScore = script.voice_fidelity_score || 0
  const fidelityColor =
    fidelityScore >= 85
      ? 'text-emerald-400'
      : fidelityScore >= 70
        ? 'text-yellow-400'
        : 'text-red-400'

  const statusStyle = statusColors[script.status] || statusColors.draft
  const hookTypeStyle = hookTypeColors[script.hook_type || ''] || 'bg-zinc-700 text-zinc-300'

  const handleCopy = () => {
    onCopy(script.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = script.word_count || script.content?.split(/\s+/).length || 0
  const duration = script.estimated_duration || Math.round(wordCount / 2.5)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 hover:border-zinc-600/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Hook */}
          <p className="text-zinc-100 font-medium truncate">
            &ldquo;{script.hook || script.content?.slice(0, 50)}&rdquo;
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {script.hook_type && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${hookTypeStyle}`}>
                {script.hook_type.replace(/_/g, ' ')}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {script.status}
            </span>
          </div>
        </div>

        {/* Fidelity Score */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`text-lg font-bold ${fidelityColor}`}>
              {fidelityScore}%
            </div>
            <div className="text-xs text-zinc-500">fidelity</div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-zinc-400" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        handleCopy()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Script
                    </button>
                    {script.status === 'draft' && (
                      <button
                        onClick={() => {
                          onStatusChange(script.id, 'approved')
                          setShowMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {script.status === 'approved' && (
                      <button
                        onClick={() => {
                          onStatusChange(script.id, 'posted')
                          setShowMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Mark Posted
                      </button>
                    )}
                    {script.status !== 'archived' && (
                      <button
                        onClick={() => {
                          onStatusChange(script.id, 'archived')
                          setShowMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Script Content */}
      <div
        className={`text-sm text-zinc-400 leading-relaxed ${
          isExpanded ? '' : 'line-clamp-3'
        }`}
      >
        {script.content}
      </div>

      {/* Expand/Collapse */}
      {script.content?.length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-700/50">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {wordCount} words
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{duration}s
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            copied
              ? 'bg-emerald-900/50 text-emerald-300'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
