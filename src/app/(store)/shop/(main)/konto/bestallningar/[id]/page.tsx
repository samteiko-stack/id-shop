import { notFound } from 'next/navigation'
import { computeOrderTotals } from '@/lib/discounts'
import { requireStorefrontCustomerOrRedirect } from '@/lib/storefront/customer-session'
import { CustomerOrderDetailClient } from './customer-order-detail-client'

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireStorefrontCustomerOrRedirect('/shop/konto?tab=bestallningar')

  const { id } = await params
  const { supabase, customer } = session

  const { data: rawOrder } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, created_at, notes,
      discount_rate, discount_amount, extra_discount_rate, extra_discount_amount,
      order_items(
        id, quantity, unit_price,
        products(name, ref, image_url)
      )
    `)
    .eq('id', id)
    .eq('customer_id', customer.id)
    .is('deleted_at', null)
    .neq('status', 'draft')
    .single()

  if (!rawOrder) notFound()

  const items = (rawOrder.order_items ?? []).map((item: Record<string, unknown>) => {
    const productRaw = item.products
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
