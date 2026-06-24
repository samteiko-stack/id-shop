import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { DASHBOARD_CACHE_REVALIDATE, PLATFORM_CACHE_TAGS } from '@/lib/platform/cache-tags'
import type { BestSellerItem } from '@/app/(platform)/dashboard/best-sellers'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]}–${String(year).slice(2)}`
}

function aggregateBestSellers(items: Array<{ product_id?: string; quantity?: number; product?: { name?: string; ref?: string } | null }>): BestSellerItem[] {
  const map = new Map<string, BestSellerItem>()
  for (const item of items) {
    const id = item.product_id
    if (!id) continue
    const existing = map.get(id)
    if (existing) {
      existing.qty += item.quantity ?? 0
    } else {
      map.set(id, {
        name: item.product?.name ?? 'Unknown',
        ref: item.product?.ref ?? '',
        qty: item.quantity ?? 0,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10)
}

async function fetchDashboardData() {
  const supabase = await createAdminClient()
  const now = new Date()

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    ordersResult,
    invoicesResult,
    invoiceCreditsResult,
    customersResult,
    expiringResult,
    recentOrdersResult,
    recentInvoicesResult,
    recentCustomersResult,
    recentProductsResult,
    thisMonthOrdersResult,
    lastMonthOrdersResult,
  ] = await Promise.allSettled([
    supabase.from('orders').select('id, status, created_at, source').is('deleted_at', null).neq('status', 'draft'),
    supabase.from('invoices').select('id, total, status, created_at, payments(amount)').is('deleted_at', null),
    supabase.from('credit_invoices').select('invoice_id, total'),
    supabase.from('customers').select('id, created_at').is('deleted_at', null).eq('is_approved', true),
    supabase
      .from('product_batches')
      .select('id, lot_number, expiry_date, product:products(name, ref)')
      .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', now.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(8),
    supabase
      .from('orders')
      .select('id, order_number, status, source, created_at, customer:customers(name)')
      .is('deleted_at', null)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, issue_date, customer:customers(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('customers')
      .select('id, name, email, org_number, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('products')
      .select('id, name, ref, unit_price, is_active, category:categories(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('id')
      .is('deleted_at', null)
      .neq('status', 'draft')
      .gte('created_at', thisMonthStart.toISOString())
      .lt('created_at', now.toISOString()),
    supabase
      .from('orders')
      .select('id')
      .is('deleted_at', null)
      .neq('status', 'draft')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', lastMonthEnd.toISOString()),
  ])

  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data ?? [] : []
  const invoices = invoicesResult.status === 'fulfilled' ? invoicesResult.value.data ?? [] : []
  const invoiceCredits = invoiceCreditsResult.status === 'fulfilled' ? invoiceCreditsResult.value.data ?? [] : []
  const customers = customersResult.status === 'fulfilled' ? customersResult.value.data ?? [] : []
  const expiring = expiringResult.status === 'fulfilled' ? expiringResult.value.data ?? [] : []

  const creditsByInvoice = invoiceCredits.reduce(
    (acc, credit) => {
      acc[credit.invoice_id] = (acc[credit.invoice_id] ?? 0) + Number(credit.total)
      return acc
    },
    {} as Record<string, number>,
  )

  const recentOrders = recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value.data ?? [] : []
  const recentInvoices = recentInvoicesResult.status === 'fulfilled' ? recentInvoicesResult.value.data ?? [] : []
  const recentCustomers = recentCustomersResult.status === 'fulfilled' ? recentCustomersResult.value.data ?? [] : []
  const recentProducts = recentProductsResult.status === 'fulfilled' ? recentProductsResult.value.data ?? [] : []

  const thisMonthOrderIds =
    thisMonthOrdersResult.status === 'fulfilled'
      ? (thisMonthOrdersResult.value.data ?? []).map((o: { id: string }) => o.id)
      : []
  const lastMonthOrderIds =
    lastMonthOrdersResult.status === 'fulfilled'
      ? (lastMonthOrdersResult.value.data ?? []).map((o: { id: string }) => o.id)
      : []

  const [thisMonthItemsResult, lastMonthItemsResult] = await Promise.allSettled([
    thisMonthOrderIds.length > 0
      ? supabase
          .from('order_items')
          .select('quantity, product_id, product:products(name, ref)')
          .in('order_id', thisMonthOrderIds)
      : Promise.resolve({ data: [] }),
    lastMonthOrderIds.length > 0
      ? supabase
          .from('order_items')
          .select('quantity, product_id, product:products(name, ref)')
          .in('order_id', lastMonthOrderIds)
      : Promise.resolve({ data: [] }),
  ])

  const thisMonthItems =
    thisMonthItemsResult.status === 'fulfilled' ? (thisMonthItemsResult.value as { data: unknown[] }).data ?? [] : []
  const lastMonthItems =
    lastMonthItemsResult.status === 'fulfilled' ? (lastMonthItemsResult.value as { data: unknown[] }).data ?? [] : []

  const bestSellersThisMonth = aggregateBestSellers(thisMonthItems as Parameters<typeof aggregateBestSellers>[0])
  const bestSellersLastMonth = aggregateBestSellers(lastMonthItems as Parameters<typeof aggregateBestSellers>[0])

  const monthlyMap = new Map<string, { orders: number; revenue: number }>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyMap.set(monthLabel(d.getFullYear(), d.getMonth()), { orders: 0, revenue: 0 })
  }

  for (const o of orders) {
    const d = new Date(o.created_at)
    const key = monthLabel(d.getFullYear(), d.getMonth())
    if (monthlyMap.has(key)) monthlyMap.get(key)!.orders++
  }
  for (const inv of invoices) {
    if (inv.status !== 'paid') continue
    const d = new Date(inv.created_at)
    const key = monthLabel(d.getFullYear(), d.getMonth())
    if (monthlyMap.has(key)) monthlyMap.get(key)!.revenue += inv.total ?? 0
  }

  const monthlyChartData = Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month,
    ...v,
  }))

  const currentMonthOrders = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo).length
  const prevMonthOrders = orders.filter(
    (o) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo,
  ).length
  const currentMonthRevenue = invoices
    .filter((i) => i.status === 'paid' && new Date(i.created_at) >= thirtyDaysAgo)
    .reduce((s, i) => s + (i.total ?? 0), 0)
  const prevMonthRevenue = invoices
    .filter((i) => i.status === 'paid' && new Date(i.created_at) >= sixtyDaysAgo && new Date(i.created_at) < thirtyDaysAgo)
    .reduce((s, i) => s + (i.total ?? 0), 0)

  const pendingInvoices = invoices.filter((inv) => {
    if (inv.status === 'cancelled') return false
    const paid = (inv.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const credited = creditsByInvoice[inv.id] ?? 0
    const settlement = computeInvoiceSettlement(Number(inv.total), paid, credited)
    return settlement.status === 'unpaid' || settlement.status === 'partial'
  }).length

  return {
    currentMonthOrders,
    prevMonthOrders,
    currentMonthRevenue,
    prevMonthRevenue,
    pendingInvoices,
    totalCustomers: customers.length,
    expiring,
    recentOrders,
    recentInvoices,
    recentCustomers,
    recentProducts,
    monthlyChartData,
    bestSellersThisMonth,
    bestSellersLastMonth,
    thisMonthLabel: monthLabel(now.getFullYear(), now.getMonth()),
    lastMonthLabel: monthLabel(lastMonthStart.getFullYear(), lastMonthStart.getMonth()),
  }
}

export function getCachedDashboardData() {
  return unstable_cache(fetchDashboardData, ['platform-dashboard'], {
    revalidate: DASHBOARD_CACHE_REVALIDATE,
    tags: [PLATFORM_CACHE_TAGS.dashboard],
  })()
}
