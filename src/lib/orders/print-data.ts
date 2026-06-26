import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrderLineItem } from '@/lib/discounts'
import { getCustomerFacingLineItems } from '@/lib/discounts'
import {
  attachLotNumbersByOrderItemId,
  lotNumbersByOrderItemId,
} from '@/lib/trace/lot-display'

type PrintOrderLineItem = OrderLineItem & {
  id: string
  product?: { name?: string; ref?: string } | null
  batches?: Array<{
    quantity?: number
    batch?: { lot_number?: string | null; expiry_date?: string | null } | null
  }> | null
}

export async function getOrderForPrint(supabase: SupabaseClient, id: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        product:products(id, name, ref, unit_price),
        batches:order_item_batches(
          quantity,
          batch:product_batches(lot_number, expiry_date)
        )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !order) return null

  const o = order as Record<string, unknown> & {
    discount_rate?: number
    extra_discount_rate?: number
    extra_discount_amount?: number
    order_tax?: number
    shipping?: number
    items?: PrintOrderLineItem[]
    order_number: string
    created_at: string
    customer?: { name?: string }
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, payments(amount)')
    .eq('order_id', id)
    .is('deleted_at', null)
    .maybeSingle()

  const discountRate = Number(o.discount_rate ?? 0)
  const extraDiscountRate = Number(o.extra_discount_rate ?? 0)
  const extraDiscountAmount = Number(o.extra_discount_amount ?? 0)
  const lotMap = lotNumbersByOrderItemId(o.items ?? [])
  const facingItems = attachLotNumbersByOrderItemId(
    getCustomerFacingLineItems(o.items ?? [], discountRate),
    lotMap,
  )
  const netSubtotal = facingItems.reduce((sum, item) => sum + item.net_line_total, 0)
  const tax = Number(o.order_tax ?? 0)
  const shipping = Number(o.shipping ?? 0)
  const grandTotal = netSubtotal - extraDiscountAmount + tax + shipping
  const paid = invoice
    ? (invoice.payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
    : 0

  return {
    order: o,
    invoice,
    facingItems,
    netSubtotal,
    extraDiscountRate,
    extraDiscountAmount,
    tax,
    shipping,
    grandTotal,
    paid,
    balance: grandTotal - paid,
  }
}
