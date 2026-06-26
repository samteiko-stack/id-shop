import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from './orders-client'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { resolveInvoicesForOrders } from '@/lib/order-invoices'
import { getUnreadOrderIds } from '@/lib/notifications'
import { getCachedCustomerOptions } from '@/lib/platform/cached-reference-data'
import type { Order, Customer } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.sales

const DEFAULT_PAGE_SIZE = 10

const ORDER_LIST_SELECT =
  'id, order_number, status, source, customer_id, created_at, discount_rate, discount_amount, extra_discount_rate, extra_discount_amount, customer:customers(id, name), items:order_items(quantity, unit_price)'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page     = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? '')) ? parseInt(pageSizeParam!) : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const supabase = await createClient()
  const [ordersResult, customers, unreadOrderIds] = await Promise.all([
    supabase
      .from('orders')
      .select(ORDER_LIST_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to),
    getCachedCustomerOptions(),
    getUnreadOrderIds(),
  ])

  const ordersForMatching = (ordersResult.data ?? []).map((order: any) => ({
    id: order.id,
    customer_id: order.customer_id,
    created_at: order.created_at,
    discount_rate: order.discount_rate,
    discount_amount: order.discount_amount,
    extra_discount_rate: order.extra_discount_rate,
    extra_discount_amount: order.extra_discount_amount,
    items: (order.items ?? []).map((item: { quantity: number; unit_price: number }) => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  }))

  const invoicesByOrder = await resolveInvoicesForOrders(supabase, ordersForMatching)

  const invoiceIds = [...invoicesByOrder.values()].flat().map((inv) => inv.id)
  const { data: credits } = invoiceIds.length > 0
    ? await supabase
        .from('credit_invoices')
        .select('invoice_id, total')
        .in('invoice_id', invoiceIds)
    : { data: [] }

  const creditsByInvoice = (credits ?? []).reduce((acc, credit) => {
    acc[credit.invoice_id] = (acc[credit.invoice_id] ?? 0) + Number(credit.total)
    return acc
  }, {} as Record<string, number>)

  const invoiceMap = new Map<string, {
    invoice_id: string
    invoice_number: string
    paid_amount: number
    balance: number
    payment_status: string
  }>()

  for (const [orderId, invoices] of invoicesByOrder.entries()) {
    const inv = invoices[0]
    if (!inv) continue
    const paidAmount = (inv.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const creditTotal = creditsByInvoice[inv.id] ?? 0
    const settlement = computeInvoiceSettlement(Number(inv.total), paidAmount, creditTotal)
    invoiceMap.set(orderId, {
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      paid_amount: paidAmount,
      balance: settlement.balanceDue,
      payment_status: settlement.status,
    })
  }

  const ordersWithPayments = (ordersResult.data || []).map((order: any) => {
    const invoiceData = invoiceMap.get(order.id)
    const itemsSubtotal = (order.items ?? []).reduce(
      (sum: number, item: { quantity: number; unit_price: number }) => sum + item.quantity * item.unit_price,
      0
    )
    const orderTotal = Math.max(
      0,
      itemsSubtotal - Number(order.discount_amount ?? 0) - Number(order.extra_discount_amount ?? 0),
    )

    return {
      ...order,
      order_total: orderTotal,
      invoice_id: invoiceData?.invoice_id ?? null,
      invoice_number: invoiceData?.invoice_number ?? null,
      paid_amount: invoiceData?.paid_amount ?? 0,
      balance: invoiceData?.balance ?? 0,
      payment_status: invoiceData ? invoiceData.payment_status : 'not_invoiced',
    }
  })

  const totalCount  = ordersResult.count ?? 0
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <OrdersClient
      initialOrders={ordersWithPayments as any}
      customers={(customers as Customer[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize: pageSize }}
      unreadOrderIds={[...unreadOrderIds]}
    />
  )
}
