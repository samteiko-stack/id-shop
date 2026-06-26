import type { SupabaseClient } from '@supabase/supabase-js'
import { computeTaxAndTotal } from '@/lib/discounts'
import { parseDefaultTaxRate } from '@/lib/tax'

const INVOICE_SELECT =
  'id, invoice_number, total, status, currency, issue_date, created_at, order_id, customer_id, payments(amount)'

type OrderForMatching = {
  id: string
  customer_id: string
  created_at: string
  discount_rate?: number | null
  discount_amount?: number | null
  extra_discount_rate?: number | null
  extra_discount_amount?: number | null
  items: { quantity: number; unit_price: number }[]
}

export function computeExpectedInvoiceTotal(
  order: Pick<OrderForMatching, 'items' | 'discount_rate' | 'discount_amount' | 'extra_discount_rate'>,
  taxRate: number,
) {
  return computeTaxAndTotal(
    {
      items: order.items,
      discount_rate: order.discount_rate,
      extra_discount_rate: order.extra_discount_rate,
    },
    taxRate,
  ).grandTotal
}

async function getDefaultTaxRate(supabase: SupabaseClient) {
  const { data } = await supabase.from('settings').select('value').eq('key', 'default_tax_rate').single()
  return parseDefaultTaxRate(data?.value)
}

function totalsMatch(a: number, b: number, eps = 0.02) {
  return Math.abs(a - b) <= eps
}

/** Find invoices for a sale — links orphaned invoices when there's a confident match. */
export async function resolveOrderInvoices(
  supabase: SupabaseClient,
  order: OrderForMatching,
  options: { autoLink?: boolean } = { autoLink: true },
) {
  const { data: linked } = await supabase
    .from('invoices')
    .select(`${INVOICE_SELECT}, credit_invoices(id)`)
    .eq('order_id', order.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (linked?.length) return linked

  const taxRate = await getDefaultTaxRate(supabase)
  const expectedTotal = computeExpectedInvoiceTotal(order, taxRate)

  const { data: orphans } = await supabase
    .from('invoices')
    .select(`${INVOICE_SELECT}, credit_invoices(id)`)
    .eq('customer_id', order.customer_id)
    .is('order_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!orphans?.length) return []

  type OrphanInvoice = (typeof orphans)[number] & { credit_invoices?: { id: string }[] }
  const orphanList = orphans as OrphanInvoice[]
  const afterOrder = orphanList.filter((inv) => inv.created_at >= order.created_at)

  const totalMatches = afterOrder.filter((inv) =>
    totalsMatch(Number(inv.total), expectedTotal),
  )

  let match: OrphanInvoice | undefined

  if (totalMatches.length === 1) {
    match = totalMatches[0]
  } else if (totalMatches.length > 1) {
    const withCredits = totalMatches.filter((inv) => (inv.credit_invoices?.length ?? 0) > 0)
    if (withCredits.length === 1) match = withCredits[0]
  }

  if (!match) {
    const withCredits = orphanList.filter((inv) => (inv.credit_invoices?.length ?? 0) > 0)
    if (withCredits.length === 1) match = withCredits[0]
  }

  if (!match) {
    const looseTotalMatches = orphanList.filter((inv) =>
      totalsMatch(Number(inv.total), expectedTotal),
    )
    if (looseTotalMatches.length === 1) match = looseTotalMatches[0]
  }

  if (!match) return []

  if (options.autoLink) {
    await supabase
      .from('invoices')
      .update({ order_id: order.id, updated_at: new Date().toISOString() })
      .eq('id', match.id)
  }

  return [match]
}

/** Batch-resolve invoices for a list of orders (for the sales list page). */
export async function resolveInvoicesForOrders(
  supabase: SupabaseClient,
  orders: OrderForMatching[],
) {
  const orderIds = orders.map((o) => o.id)
  if (orderIds.length === 0) return new Map<string, Awaited<ReturnType<typeof resolveOrderInvoices>>>()

  const { data: linkedInvoices } = await supabase
    .from('invoices')
    .select(`${INVOICE_SELECT}, credit_invoices(id)`)
    .in('order_id', orderIds)
    .is('deleted_at', null)

  const byOrderId = new Map<string, NonNullable<typeof linkedInvoices>>()
  for (const inv of linkedInvoices ?? []) {
    if (!inv.order_id) continue
    const list = byOrderId.get(inv.order_id) ?? []
    list.push(inv)
    byOrderId.set(inv.order_id, list)
  }

  return byOrderId
}

export function primaryInvoiceFromMap(
  byOrderId: Map<string, { id: string; invoice_number: string; total: number; payments?: { amount: number }[] | null }[]>,
  orderId: string,
) {
  return byOrderId.get(orderId)?.[0] ?? null
}
