'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export interface MonthlyChartPoint {
  month: string
  orders: number
  revenue: number
  sales: number
  tax: number
}

interface Props {
  data: MonthlyChartPoint[]
}

const BAR_WIDTH = 28
const PAIR_GAP = 1

const LEGEND_ITEMS = [
  { key: 'sales' as const, label: 'Sales ex VAT', color: 'var(--chart-1)' },
  { key: 'tax' as const, label: 'VAT', color: 'var(--chart-4)' },
]

function fmtAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

function makeDualBarShape(hidden: Record<string, boolean>) {
  return function DualBarShape(props: { x?: number; y?: number; height?: number; width?: number; payload?: MonthlyChartPoint }) {
    const { x = 0, y = 0, height = 0, payload, width = BAR_WIDTH } = props
    if (!payload) return null

    const salesHeight = height
    const taxHeight = payload.sales > 0 ? (salesHeight * payload.tax) / payload.sales : 0
    const taxY = y + salesHeight - taxHeight
    const centerX = x + width / 2
    const leftX = centerX - BAR_WIDTH - PAIR_GAP / 2
    const rightX = centerX + PAIR_GAP / 2

    return (
      <g>
        {!hidden.sales ? (
          <rect
            x={leftX}
            y={y}
            width={BAR_WIDTH}
            height={salesHeight}
            fill="var(--chart-1)"
            rx={3}
            ry={3}
          />
        ) : null}
        {!hidden.tax ? (
          <rect
            x={rightX}
            y={taxY}
            width={BAR_WIDTH}
            height={taxHeight}
            fill="var(--chart-4)"
            rx={3}
            ry={3}
          />
        ) : null}
      </g>
    )
  }
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: MonthlyChartPoint }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  const sales = row?.sales ?? 0
  const tax = row?.tax ?? 0
  const total = row?.revenue ?? sales + tax
  const orders = row?.orders ?? 0

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">Sales ex VAT: {formatCurrency(sales)}</p>
      <p className="text-muted-foreground">VAT: {formatCurrency(tax)}</p>
      <p className="font-medium text-foreground">Total: {formatCurrency(total)}</p>
      <p className="mt-1 text-muted-foreground">{orders} orders</p>
    </div>
  )
}

export function DashboardRevenueChart({ data }: Props) {
  const chartData = data.slice(-6)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const toggleSeries = (key: string) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="12%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmtAxis}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          content={() => (
            <ul className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px]">
              {LEGEND_ITEMS.map(({ key, label, color }) => {
                const active = !hidden[key]
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleSeries(key)}
                      className={`inline-flex items-center gap-1.5 ${active ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                    >
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                      {label}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        />
        <Bar
          dataKey="sales"
          name="Sales ex VAT"
          fill="var(--chart-1)"
          maxBarSize={BAR_WIDTH * 2 + PAIR_GAP}
          shape={makeDualBarShape(hidden) as never}
          legendType="none"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
