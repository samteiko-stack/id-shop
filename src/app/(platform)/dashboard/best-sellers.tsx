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

function HorizontalBars({ data }: { data: BestSellerItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No sales data this period.</p>
  }

  const max = data[0].qty

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 group">
          <span className="w-4 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground truncate pr-2">{item.name}</span>
              <span className="text-xs font-semibold text-foreground shrink-0">{item.qty}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(item.qty / max) * 100}%`, opacity: 1 - i * 0.06 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function BestSellers({ thisMonth, lastMonth, thisMonthLabel, lastMonthLabel }: Props) {
  const [active, setActive] = useState<'this' | 'last'>('this')

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setActive('this')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${active === 'this' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {thisMonthLabel}
        </button>
        <button
          onClick={() => setActive('last')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${active === 'last' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {lastMonthLabel}
        </button>
      </div>
      <HorizontalBars data={active === 'this' ? thisMonth : lastMonth} />
    </div>
  )
}
