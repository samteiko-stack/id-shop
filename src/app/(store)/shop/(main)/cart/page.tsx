import { shopMeta } from '@/lib/metadata'
import { redirect } from 'next/navigation'
import { CartClient } from './cart-client'
import { getStorefrontAuthContext } from '@/lib/storefront/auth-context'

export const metadata = shopMeta.cart

export default async function CartPage() {
  const auth = await getStorefrontAuthContext()

  if (!auth) {
    redirect('/shop/login?redirectTo=/shop/cart')
  }

  if (auth.role !== 'customer') {
    redirect('/dashboard')
  }

  const customer = auth.customer
  if (!customer) {
    redirect('/shop/login?redirectTo=/shop/cart')
  }

  if (!customer.is_approved) {
    redirect('/shop/pending')
  }

  const { data: rawOrder } = await auth.supabase
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
