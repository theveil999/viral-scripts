"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-zinc-800 rounded-lg
        ${className}
      `}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Content blocks */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
