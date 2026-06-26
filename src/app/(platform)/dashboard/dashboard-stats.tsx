import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  ShoppingCart,
  TrendingUp,
  Users,
} from '@/components/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardRevenueChart, type MonthlyChartPoint } from './dashboard-revenue-chart'

type DashboardStatsProps = {
  currentMonthOrders: number
  prevMonthOrders: number
  currentMonthRevenue: number
  prevMonthRevenue: number
  pendingInvoices: number
  totalCustomers: number
  monthlyChartData: MonthlyChartPoint[]
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const pct = pctChange(current, previous)

  if (diff === 0) {
    return <span className="text-[11px] text-muted-foreground">Flat vs prior 30d</span>
  }

  const up = diff > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-medium',
        up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      )}
    >
      <Icon className="h-3 w-3" />
      {pct !== null ? `${up ? '+' : ''}${pct}%` : 'New'}
    </span>
  )
}

type StatCardProps = {
  label: string
  value: string
  href: string
  icon: React.ElementType
  featured?: boolean
  trend?: React.ReactNode
  iconClassName?: string
}

function StatCard({ label, value, href, icon: Icon, featured, trend, iconClassName }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[118px] flex-col justify-between rounded-2xl border p-4 transition-all hover:shadow-sm',
        featured
          ? 'border-primary/20 bg-primary text-primary-foreground hover:bg-primary/95'
          : 'border-border/70 bg-card hover:border-primary/25 hover:bg-muted/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            featured ? 'bg-white/15' : iconClassName ?? 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        {trend}
      </div>
      <div>
        <p className={cn('text-xs', featured ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      </div>
    </Link>
  )
}

export function DashboardStats({
  currentMonthOrders,
  prevMonthOrders,
  currentMonthRevenue,
  prevMonthRevenue,
  pendingInvoices,
  totalCustomers,
  monthlyChartData,
}: DashboardStatsProps) {
  const recentRevenue = monthlyChartData.slice(-6)
  const latestMonth = recentRevenue.at(-1)

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Revenue"
          value={formatCurrency(currentMonthRevenue)}
          href="/invoices"
          icon={TrendingUp}
          featured
          trend={<TrendBadge current={currentMonthRevenue} previous={prevMonthRevenue} />}
        />
        <StatCard
          label="Orders"
          value={String(currentMonthOrders)}
          href="/orders"
          icon={ShoppingCart}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          trend={<TrendBadge current={currentMonthOrders} previous={prevMonthOrders} />}
        />
        <StatCard
          label="Open invoices"
          value={String(pendingInvoices)}
          href="/invoices"
          icon={FileText}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          href="/customers"
          icon={Users}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2 pt-5">
          <div>
            <CardTitle className="text-base font-semibold">Sales overview</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Net sales & VAT · paid invoices · last 6 months</p>
          </div>
          {latestMonth ? (
            <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-right">
              <p className="text-[11px] text-muted-foreground">{latestMonth.month}</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(latestMonth.revenue)}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(latestMonth.sales)} + {formatCurrency(latestMonth.tax)} VAT
              </p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="h-[268px] pb-4 pt-0">
          <DashboardRevenueChart data={monthlyChartData} />
        </CardContent>
      </Card>
    </section>
  )
}
