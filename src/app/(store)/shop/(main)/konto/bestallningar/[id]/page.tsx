import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { computeOrderTotals } from '@/lib/discounts'
import { createAdminClient } from '@/lib/supabase/server'
import { shopMeta } from '@/lib/metadata'
import { requireStorefrontCustomerOrRedirect } from '@/lib/storefront/customer-session'
import { getCustomerOrder } from '@/lib/storefront/customer-orders'
import { CustomerOrderDetailClient } from './customer-order-detail-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const admin = await createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('order_number')
    .eq('id', id)
    .is('deleted_at', null)
    .neq('status', 'draft')
    .maybeSingle()

  if (!order) return shopMeta.account
  return shopMeta.orderDetail(order.order_number)
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireStorefrontCustomerOrRedirect('/shop/konto?tab=bestallningar')

  const { id } = await params
  const { customer } = session

  const { data: rawOrder } = await getCustomerOrder(customer.id, id)

  if (!rawOrder) notFound()

  const items = (rawOrder.order_items ?? []).map((item: Record<string, unknown>) => {
    const productRaw = item.product
    const product = Array.isArray(productRaw) ? productRaw[0] ?? null : productRaw
    return {
      id: item.id as string,
      quantity: item.quantity as number,
      unit_price: Number(item.unit_price),
      product: product as { name: string; ref: string; image_url: string | null } | null,
    }
  })

  const totals = computeOrderTotals({
    items: items.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price })),
    discount_rate: Number(rawOrder.discount_rate ?? 0),
    extra_discount_rate: Number(rawOrder.extra_discount_rate ?? 0),
  })

  return (
    <CustomerOrderDetailClient
      order={{
        id: rawOrder.id,
        order_number: rawOrder.order_number,
        status: rawOrder.status,
        created_at: rawOrder.created_at,
        currency: 'SEK',
        notes: rawOrder.notes,
        items,
        subtotal: totals.listSubtotal,
        discount_amount: totals.generalDiscountAmount,
        extra_discount_amount: totals.extraDiscountAmount,
        total: totals.taxableSubtotal,
      }}
    />
  )
}
