import { createClient } from '@/lib/supabase/server'
import { ReportsClient, type ReportData } from './reports-client'

export const metadata = { title: 'Reports' }

async function getReportData(): Promise<ReportData> {
  const supabase = await createClient()
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [invoicesRes, ordersRes, orderItemsRes, expiryRes] = await Promise.allSettled([
    supabase
      .from('invoices')
      .select('id, total, subtotal, tax_amount, currency, issue_date, status, customer_id, customer:customers(id, name)')
      .is('deleted_at', null)
      .gte('issue_date', twelveMonthsAgo),

    supabase
      .from('orders')
      .select('id, status, created_at')
      .is('deleted_at', null),

    supabase
      .from('order_items')
      .select('id, quantity, unit_price, product_id, product:products(id, name, ref), order:orders(status)')
      .is('orders.deleted_at', null),

    supabase
      .from('product_batches')
      .select('id, lot_number, expiry_date, product:products(name, ref)')
      .lte('expiry_date', ninetyDaysFromNow)
      .gte('expiry_date', now.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(100),
  ])

  const invoices   = invoicesRes.status   === 'fulfilled' ? invoicesRes.value.data   ?? [] : []
  const orders     = ordersRes.status     === 'fulfilled' ? ordersRes.value.data     ?? [] : []
  const orderItems = orderItemsRes.status === 'fulfilled' ? orderItemsRes.value.data ?? [] : []
  const expiry     = expiryRes.status     === 'fulfilled' ? expiryRes.value.data     ?? [] : []

  /* ── Sales / monthly chart ─────────────────────── */
  const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid')

  const monthlyMap: Record<string, { orders: number; revenue: number }> = {}
  // Build last 12 month slots
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    monthlyMap[key] = { orders: 0, revenue: 0 }
  }
  for (const inv of paidInvoices) {
    if (!inv.issue_date) continue
    const d = new Date(inv.issue_date)
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += (inv as any).total ?? 0
      monthlyMap[key].orders  += 1
    }
  }
  const monthly = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  const totalRevenue   = paidInvoices.reduce((s: number, inv: any) => s + (inv.total ?? 0), 0)
  const totalOrders    = orders.length
  const avgOrderValue  = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0

  const orderStatusCounts = orders.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  /* ── Top products ───────────────────────────────── */
  const productMap: Record<string, { id: string; name: string; ref: string; qty: number; revenue: number }> = {}
  for (const item of orderItems) {
    const p = (item as any).product
    const orderStatus = (item as any).order?.status
    if (!p || orderStatus === 'cancelled') continue
    if (!productMap[p.id]) productMap[p.id] = { id: p.id, name: p.name, ref: p.ref, qty: 0, revenue: 0 }
    productMap[p.id].qty     += (item as any).quantity ?? 0
    productMap[p.id].revenue += ((item as any).quantity ?? 0) * ((item as any).unit_price ?? 0)
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 15)

  /* ── Top customers ──────────────────────────────── */
  const customerMap: Record<string, { id: string; name: string; total: number; orderCount: number }> = {}
  for (const inv of paidInvoices) {
    const c = (inv as any).customer
    if (!c) continue
    if (!customerMap[c.id]) customerMap[c.id] = { id: c.id, name: c.name, total: 0, orderCount: 0 }
    customerMap[c.id].total      += (inv as any).total ?? 0
    customerMap[c.id].orderCount += 1
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  /* ── Tax by month ───────────────────────────────── */
  const taxMap: Record<string, { subtotal: number; tax: number; total: number }> = {}
  for (const inv of paidInvoices) {
    if (!inv.issue_date) continue
    const month = inv.issue_date.slice(0, 7) // YYYY-MM
    if (!taxMap[month]) taxMap[month] = { subtotal: 0, tax: 0, total: 0 }
    taxMap[month].subtotal += (inv as any).subtotal ?? 0
    taxMap[month].tax      += (inv as any).tax_amount ?? 0
    taxMap[month].total    += (inv as any).total ?? 0
  }
  const taxByMonth = Object.entries(taxMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, v]) => ({ month, ...v }))

  return {
    monthly,
    orderStatusCounts,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    topProducts,
    topCustomers,
    taxByMonth,
    expiryBatches: expiry as any,
  }
}

export default async function ReportsPage() {
  const data = await getReportData()
  return <ReportsClient data={data} />
}
