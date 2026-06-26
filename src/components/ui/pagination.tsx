'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from './button'
import { ChevronLeft, ChevronRight } from '@/components/icons'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface Props {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export function Pagination({ page, totalPages, totalCount, pageSize }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function go(p: number, size?: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    if (size) params.set('pageSize', String(size))
    router.push(`${pathname}?${params.toString()}`)
  }

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between px-1 pt-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          {totalCount === 0
            ? 'No results'
            : <>Showing <span className="font-medium text-foreground">{from}–{to}</span> of <span className="font-medium text-foreground">{totalCount}</span></>
          }
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Show</span>
          <select
            value={pageSize}
            onChange={(e) => go(1, Number(e.target.value))}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:border-ring transition-colors"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => go(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => go(page + 1)} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
