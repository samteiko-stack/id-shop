import { platformMeta } from '@/lib/metadata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = platformMeta.dashboard
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { getCachedDashboardData } from '@/lib/platform/cached-dashboard'
import { AlertTriangle } from '@/components/icons'
import Link from 'next/link'
import { QuickLinks } from './quick-links'
import { BestSellers } from './best-sellers'
import { LatestFive } from './latest-five'
import { DashboardAlerts } from './dashboard-alerts'
import { DashboardStats } from './dashboard-stats'

export default async function DashboardPage() {
  const data = await getCachedDashboardData()

  return (
    <div className="space-y-5">
      <DashboardAlerts />

      <DashboardStats
        currentMonthOrders={data.currentMonthOrders}
        prevMonthOrders={data.prevMonthOrders}
        currentMonthRevenue={data.currentMonthRevenue}
        prevMonthRevenue={data.prevMonthRevenue}
        pendingInvoices={data.pendingInvoices}
        totalCustomers={data.totalCustomers}
        monthlyChartData={data.monthlyChartData}
      />

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          <QuickLinks />
        </CardContent>
      </Card>

      {/* Best Sellers + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Best sellers</CardTitle>
            <p className="text-[11px] text-muted-foreground">Top 5 products by units</p>
          </CardHeader>
          <CardContent className="px-3 pb-4 pt-0">
            <BestSellers
              thisMonth={data.bestSellersThisMonth}
              lastMonth={data.bestSellersLastMonth}
              thisMonthLabel={data.thisMonthLabel}
              lastMonthLabel={data.lastMonthLabel}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-0 pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
            <p className="text-[11px] text-muted-foreground">Latest across the platform</p>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-2">
            <LatestFive
              orders={data.recentOrders as any}
              invoices={data.recentInvoices as any}
              customers={data.recentCustomers as any}
              products={data.recentProducts as any}
            />
          </CardContent>
        </Card>
      </div>

      {/* Expiry Alerts */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Expiry alerts
              {data.expiring.length > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/15 px-1.5 text-[11px] font-bold text-warning">
                  {data.expiring.length}
                </span>
              )}
            </CardTitle>
            <Link href="/reports" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.expiring.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No batches expiring within 90 days.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-border">
              {data.expiring.map((batch: any) => {
                const daysLeft = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysLeft <= 30
                return (
                  <div key={batch.id} className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0">
                    <div className="mb-0.5 flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{(batch.product as any)?.name ?? 'Unknown'}</p>
                      <Badge className={`shrink-0 text-[10px] ${isUrgent ? 'bg-[var(--badge-destructive-bg)] text-[var(--badge-destructive-fg)] border-0' : 'bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)] border-0'}`}>
                        {daysLeft}d
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">LOT {batch.lot_number}</p>
                    <p className="text-[11px] text-muted-foreground">Expires {formatDate(batch.expiry_date)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
