import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CartClient } from './cart-client'

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'customer') {
    redirect('/shop/login?redirectTo=/shop/cart')
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, is_approved')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer?.is_approved) {
    redirect('/shop/pending')
  }

  const { data: rawOrder } = await supabase
    .from('orders')
    .select(`
      id, order_number, discount_rate, extra_discount_rate, extra_discount_amount,
      order_items(
        id, quantity, unit_price,
        products(id, name, ref, image_url)
      )
    `)
    .eq('customer_id', customer.id)
    .eq('status', 'draft')
    .eq('source', 'storefront')
    .maybeSingle()

  // Supabase returns products as array; normalize to single object
  const draftOrder = rawOrder ? {
    ...rawOrder,
    order_items: (rawOrder.order_items ?? []).map((item: any) => ({
      ...item,
      products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
    })),
  } : null

  return (
    <CartClient
      draftOrder={draftOrder}
      customerName={customer.name}
      discountRate={Number(draftOrder?.discount_rate ?? 0)}
      extraDiscountRate={Number(draftOrder?.extra_discount_rate ?? 0)}
    />
  )
}
