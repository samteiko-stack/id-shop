'use client'

import { useState } from 'react'

export interface BestSellerItem {
  name: string
  ref: string
  qty: number
}

interface Props {
  thisMonth: BestSellerItem[]
  lastMonth: BestSellerItem[]
  thisMonthLabel: string
  lastMonthLabel: string
}

const TOP_N = 5

function CompactList({ data }: { data: BestSellerItem[] }) {
  const items = data.slice(0, TOP_N)

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No sales data this period.</p>
  }

  const max = items[0].qty

  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={`${item.ref}-${i}`} className="rounded-lg px-2 py-1.5 hover:bg-muted/40">
          <div className="flex items-baseline gap-2">
            <span className="w-4 shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={item.name}>
              {item.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{item.qty}</span>
          </div>
          <div className="mt-1 ml-6 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${(item.qty / max) * 100}%`, opacity: 1 - i * 0.08 }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function BestSellers({ thisMonth, lastMonth, thisMonthLabel, lastMonthLabel }: Props) {
  const [active, setActive] = useState<'this' | 'last'>('this')

  return (
    <div>
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-muted p-0.5">
        {([
          ['this', thisMonthLabel],
          ['last', lastMonthLabel],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
              active === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <CompactList data={active === 'this' ? thisMonth : lastMonth} />
    </div>
  )
}
