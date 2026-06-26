'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface MonthlyData {
  month: string
  orders: number
  revenue: number
}

interface Props {
  data: MonthlyData[]
}

type View = 'revenue' | 'orders'

function fmt(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

const CustomTooltip = ({ active, payload, label, view }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        {view === 'revenue' ? `Revenue: ${fmt(val)}` : `Orders: ${val}`}
      </p>
    </div>
  )
}

export function OverviewChart({ data }: Props) {
  const [view, setView] = useState<View>('revenue')

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const maxOrders  = Math.max(...data.map(d => d.orders), 1)

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-1 mb-5 bg-muted rounded-lg p-1 w-fit">
        {(['revenue', 'orders'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === v
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v === 'revenue' ? 'Revenue' : 'Orders'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {view === 'revenue' ? (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={fmt} width={44} />
            <Tooltip content={<CustomTooltip view="revenue" />} />
            <Area
              type="monotone" dataKey="revenue"
              stroke="var(--primary)" strokeWidth={2.5}
              fill="url(#revenueGrad)" dot={false}
              activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 0 }}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip content={<CustomTooltip view="orders" />} />
            <Bar dataKey="orders" radius={[5, 5, 0, 0]} maxBarSize={40}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill="var(--primary)"
                  opacity={d.orders / maxOrders < 0.15 ? 0.25 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
