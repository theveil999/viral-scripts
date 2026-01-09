'use client'

import { motion } from 'framer-motion'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeStyles[size]} ${className}`}
    >
      <svg
        className="w-full h-full text-fuchsia-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  )
}

// Loading overlay component
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-zinc-400 text-sm animate-pulse">{message}</p>
      </div>
    </div>
  )
}

// Skeleton loading component
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`shimmer rounded-lg ${className}`} />
  )
}
