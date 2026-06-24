import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditOrderClient } from './edit-order-client'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: order }, { data: customers }, { data: products }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(id, name, ref, unit_price))')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase.from('customers').select('id, name, discount_group:discount_groups(discount_rate)').is('deleted_at', null).order('name'),
    supabase.from('products').select('id, name, ref, unit_price').is('deleted_at', null).order('name'),
  ])

  if (!order) notFound()

  return (
    <EditOrderClient
      order={order as any}
      customers={(customers ?? []).map((c: any) => ({
        ...c,
        discount_rate: c.discount_group?.discount_rate ?? 0,
      }))}
      products={products ?? []}
    />
  )
}
