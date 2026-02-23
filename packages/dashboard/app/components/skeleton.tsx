"use client";

function SkeletonBase({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden rounded bg-white/[0.04] ${className}`} style={style}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div className={`glass rounded-xl border border-[var(--border-color)] p-4 ${className}`}>
      <SkeletonBase className="h-3 w-16 mb-3" />
      <SkeletonBase className="h-8 w-20" />
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass rounded-xl border border-[var(--border-color)] p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <SkeletonBase className="h-5 w-32" />
        <SkeletonBase className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBase className="h-4 w-48 mb-4" />
      <div className="flex gap-4">
        <SkeletonBase className="h-3 w-12" />
        <SkeletonBase className="h-3 w-12" />
        <SkeletonBase className="h-3 w-12" />
      </div>
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`glass rounded-xl border border-[var(--border-color)] p-4 ${className}`}>
      <SkeletonBase className="h-4 w-32 mb-4" />
      <div className="flex items-end gap-1 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="flex-1"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}
