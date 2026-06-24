import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCachedDashboardData } from '@/lib/platform/cached-dashboard'
import {
  ShoppingCart, FileText, Users, AlertTriangle,
  TrendingUp,
} from '@/components/icons'
import Link from 'next/link'
import { QuickLinks } from './quick-links'
import { OverviewChart } from './overview-chart'
import { BestSellers } from './best-sellers'
import { LatestFive } from './latest-five'
import { DashboardAlerts } from './dashboard-alerts'

export default async function DashboardPage() {
  const data = await getCachedDashboardData()

  return (
    <div className="space-y-5">
      <DashboardAlerts />

      {/* KPI Row */}
      <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Orders this month',
            value: data.currentMonthOrders,
            sub: 'This month',
            icon: ShoppingCart,
          },
          {
            label: 'Revenue this month',
            value: formatCurrency(data.currentMonthRevenue),
            sub: 'This month',
            icon: TrendingUp,
          },
          {
            label: 'Pending invoices',
            value: data.pendingInvoices,
            sub: 'Awaiting payment',
            icon: FileText,
          },
          {
            label: 'Total customers',
            value: data.totalCustomers,
            sub: 'Approved accounts',
            icon: Users,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          <QuickLinks />
        </CardContent>
      </Card>

      {/* Overview Chart + Best Sellers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-0 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Sales Overview</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <OverviewChart data={data.monthlyChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0 pt-5">
            <CardTitle className="text-base font-semibold">Best Sellers</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Top products by units</p>
          </CardHeader>
          <CardContent className="pt-4 pb-5">
            <BestSellers
              thisMonth={data.bestSellersThisMonth}
              lastMonth={data.bestSellersLastMonth}
              thisMonthLabel={data.thisMonthLabel}
              lastMonthLabel={data.lastMonthLabel}
            />
          </CardContent>
        </Card>
      </div>

      {/* Latest Five */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-0 pt-5 px-0">
          <LatestFive
            orders={data.recentOrders as any}
            invoices={data.recentInvoices as any}
            customers={data.recentCustomers as any}
            products={data.recentProducts as any}
          />
        </CardHeader>
      </Card>

      {/* Expiry Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Expiry Alerts
              {data.expiring.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning/15 text-warning text-xs font-bold">
                  {data.expiring.length}
                </span>
              )}
            </CardTitle>
            <Link href="/reports" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.expiring.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No batches expiring within 90 days.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
              {data.expiring.map((batch: any) => {
                const daysLeft = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysLeft <= 30
                return (
                  <div key={batch.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{(batch.product as any)?.name ?? 'Unknown'}</p>
                      <Badge className={`shrink-0 text-xs ${isUrgent ? 'bg-[var(--badge-destructive-bg)] text-[var(--badge-destructive-fg)] border-0' : 'bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)] border-0'}`}>
                        {daysLeft}d
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">LOT: {batch.lot_number}</p>
                    <p className="text-xs text-muted-foreground">Expires {formatDate(batch.expiry_date)}</p>
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
