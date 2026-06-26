import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* KPI panel */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-8">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2 py-1">
                <Skeleton className="h-3 w-3 shrink-0" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-3.5 w-8" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
