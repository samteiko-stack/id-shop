import { createAdminClient } from '@/lib/supabase/server'

const ORDER_LIST_SELECT = `
  id, order_number, status, created_at,
  discount_rate, discount_amount, extra_discount_rate, extra_discount_amount,
  order_items(quantity, unit_price)
`

const ORDER_DETAIL_SELECT = `
  id, order_number, status, created_at, notes,
  discount_rate, discount_amount, extra_discount_rate, extra_discount_amount,
  order_items(
    id, quantity, unit_price,
    product:products(name, ref, image_url)
  )
`

/** Load a customer's orders via service role after session ownership is verified. */
export async function listCustomerOrders(customerId: string) {
  const supabase = await createAdminClient()
  return supabase
    .from('orders')
    .select(ORDER_LIST_SELECT)
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
}

/** Load one customer order when the caller has already verified customer_id ownership. */
export async function getCustomerOrder(customerId: string, orderId: string) {
  const supabase = await createAdminClient()
  return supabase
    .from('orders')
    .select(ORDER_DETAIL_SELECT)
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .neq('status', 'draft')
    .maybeSingle()
}
