'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { OverviewChart } from '@/app/(platform)/dashboard/overview-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp, Package, Users, Receipt, AlertTriangle,
  ShoppingCart, FileText, ArrowUpRight,
} from '@/components/icons'

/* ── Types ─────────────────────────────────────────── */
export interface ReportData {
  // Sales
  monthly: { month: string; orders: number; revenue: number }[]
  orderStatusCounts: Record<string, number>
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  // Products
  topProducts: { id: string; name: string; ref: string; qty: number; revenue: number }[]
  // Customers
  topCustomers: { id: string; name: string; total: number; orderCount: number }[]
  // Tax
  taxByMonth: { month: string; subtotal: number; tax: number; total: number }[]
  // Expiry
  expiryBatches: { id: string; lot_number: string; expiry_date: string; product: { name: string; ref: string } | null }[]
}

const TABS = [
  { key: 'sales',     label: 'Sales',          icon: TrendingUp   },
  { key: 'products',  label: 'Products',        icon: Package      },
  { key: 'customers', label: 'Customers',       icon: Users        },
  { key: 'tax',       label: 'Tax Summary',     icon: Receipt      },
  { key: 'expiry',    label: 'Expiry Alerts',   icon: AlertTriangle},
] as const

type Tab = typeof TABS[number]['key']

/* ── KPI Card ───────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Progress bar row ───────────────────────────────── */
function BarRow({ rank, label, sub, value, displayValue, max, href }: {
  rank: number; label: string; sub?: string; value: number; displayValue: string; max: number; href?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const content = (
    <div className={`flex items-center gap-4 px-6 py-3.5 ${href ? 'hover:bg-accent/30 transition-colors' : ''}`}>
      <span className="text-sm font-bold text-muted-foreground w-6 shrink-0 text-right">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{label}</p>
            {sub && <p className="text-xs text-muted-foreground font-mono">{sub}</p>}
          </div>
          <span className="text-sm font-semibold text-foreground shrink-0 ml-4">{displayValue}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%`, opacity: 1 - rank * 0.05 }} />
        </div>
      </div>
      {href && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
    </div>
  )
  return href ? <Link href={href} className="block group">{content}</Link> : <div>{content}</div>
}

/* ── Main client component ──────────────────────────── */
export function ReportsClient({ data }: { data: ReportData }) {
  const [tab, setTab] = useState<Tab>('sales')

  const maxProductQty     = data.topProducts[0]?.qty ?? 1
  const maxCustomerTotal  = data.topCustomers[0]?.total ?? 1
  const maxTaxTotal       = Math.max(...data.taxByMonth.map(r => r.total), 1)

  const totalExpiry = data.expiryBatches.length
  const urgentExpiry = data.expiryBatches.filter(b => {
    const d = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 864e5)
    return d <= 30
  }).length

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === 'expiry' && totalExpiry > 0 && (
              <span className={`inline-flex items-center justify-center h-4 min-w-4 rounded-full text-[10px] font-bold px-1 ${urgentExpiry > 0 ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                {totalExpiry}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sales ── */}
      {tab === 'sales' && (
        <div className="space-y-5 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} sub="Paid invoices" icon={TrendingUp} />
            <KpiCard label="Total Orders" value={data.totalOrders} sub="All time" icon={ShoppingCart} />
            <KpiCard label="Avg Order Value" value={formatCurrency(data.avgOrderValue)} sub="Per paid invoice" icon={FileText} />
          </div>

          {/* Order status breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.orderStatusCounts).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xl font-bold text-foreground mb-1.5">{count}</p>
                  <StatusBadge status={status} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base font-semibold">Revenue & Orders Over Time</CardTitle>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </CardHeader>
            <CardContent className="pb-5">
              {data.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No data yet.</p>
              ) : (
                <OverviewChart data={data.monthly} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Products ── */}
      {tab === 'products' && (
        <div className="space-y-5 pt-5">
          <Card>
            <CardHeader className="pb-0 pt-5">
              <CardTitle className="text-base font-semibold">Top Products by Units Sold</CardTitle>
              <p className="text-xs text-muted-foreground">All time, across all fulfilled orders</p>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              {data.topProducts.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">No order data yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.topProducts.map((p, i) => (
                    <BarRow
                      key={p.id}
                      rank={i + 1}
                      label={p.name}
                      sub={`REF: ${p.ref}`}
                      value={p.qty}
                      displayValue={`${p.qty} units · ${formatCurrency(p.revenue)}`}
                      max={maxProductQty}
                      href={`/products/${p.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Customers ── */}
      {tab === 'customers' && (
        <div className="space-y-5 pt-5">
          <Card>
            <CardHeader className="pb-0 pt-5">
              <CardTitle className="text-base font-semibold">Top Customers by Revenue</CardTitle>
              <p className="text-xs text-muted-foreground">Based on paid invoices, all time</p>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              {data.topCustomers.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">No paid invoices yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.topCustomers.map((c, i) => (
                    <BarRow
                      key={c.id}
                      rank={i + 1}
                      label={c.name}
                      sub={`${c.orderCount} order${c.orderCount !== 1 ? 's' : ''}`}
                      value={c.total}
                      displayValue={formatCurrency(c.total)}
                      max={maxCustomerTotal}
                      href={`/customers/${c.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tax ── */}
      {tab === 'tax' && (
        <div className="space-y-5 pt-5">
          <Card>
            <CardHeader className="pb-0 pt-5">
              <CardTitle className="text-base font-semibold">VAT Summary by Month</CardTitle>
              <p className="text-xs text-muted-foreground">Calculated from paid invoices only</p>
            </CardHeader>
            <CardContent className="p-0">
              {data.taxByMonth.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">No paid invoices yet.</p>
              ) : (
                <>
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-4 px-6 py-2.5 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-y border-border">
                    <span>Month</span>
                    <span className="text-right">Net (excl. VAT)</span>
                    <span className="text-right">VAT</span>
                    <span className="text-right">Gross (incl. VAT)</span>
                  </div>
                  <div className="divide-y divide-border">
                    {data.taxByMonth.map((row) => (
                      <div key={row.month} className="grid grid-cols-4 gap-4 px-6 py-3.5 hover:bg-accent/30 transition-colors">
                        <span className="text-sm font-medium text-foreground">{row.month}</span>
                        <span className="text-sm text-right text-foreground tabular-nums">{formatCurrency(row.subtotal)}</span>
                        <span className="text-sm text-right font-semibold text-foreground tabular-nums">{formatCurrency(row.tax)}</span>
                        <span className="text-sm text-right font-bold text-foreground tabular-nums">{formatCurrency(row.total)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Totals row */}
                  <div className="grid grid-cols-4 gap-4 px-6 py-3.5 border-t-2 border-border bg-muted/30">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-sm text-right font-bold text-foreground tabular-nums">
                      {formatCurrency(data.taxByMonth.reduce((s, r) => s + r.subtotal, 0))}
                    </span>
                    <span className="text-sm text-right font-bold text-foreground tabular-nums">
                      {formatCurrency(data.taxByMonth.reduce((s, r) => s + r.tax, 0))}
                    </span>
                    <span className="text-sm text-right font-bold text-foreground tabular-nums">
                      {formatCurrency(data.taxByMonth.reduce((s, r) => s + r.total, 0))}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Expiry ── */}
      {tab === 'expiry' && (
        <div className="space-y-5 pt-5">
          {urgentExpiry > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">
                {urgentExpiry} batch{urgentExpiry !== 1 ? 'es' : ''} expiring within 30 days. Review immediately.
              </p>
            </div>
          )}
          <Card>
            <CardHeader className="pb-0 pt-5">
              <CardTitle className="text-base font-semibold">Batches Expiring Within 90 Days</CardTitle>
              <p className="text-xs text-muted-foreground">{totalExpiry} batch{totalExpiry !== 1 ? 'es' : ''} found</p>
            </CardHeader>
            <CardContent className="p-0">
              {data.expiryBatches.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">No batches expiring within 90 days.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-2.5 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-y border-border">
                    <span>Product / LOT</span>
                    <span className="text-right">Expiry Date</span>
                    <span className="text-right">Days Left</span>
                  </div>
                  <div className="divide-y divide-border">
                    {data.expiryBatches.map((batch) => {
                      const daysLeft = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / 864e5)
                      const isUrgent = daysLeft <= 30
                      return (
                        <div key={batch.id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3.5 items-center">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{batch.product?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground font-mono">REF: {batch.product?.ref} · LOT: {batch.lot_number}</p>
                          </div>
                          <span className="text-sm text-muted-foreground text-right">{formatDate(batch.expiry_date)}</span>
                          <Badge className={`text-xs border-0 justify-self-end ${isUrgent ? 'bg-[var(--badge-destructive-bg)] text-[var(--badge-destructive-fg)]' : 'bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)]'}`}>
                            {daysLeft}d
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
