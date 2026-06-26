import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createPlatformReadClient } from '@/lib/supabase/platform-client'
import { platformMeta } from '@/lib/metadata'
import { EditOrderClient } from './edit-order-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const platform = await createPlatformReadClient()
  if ('error' in platform) return platformMeta.sales

  const { data: order } = await platform.supabase
    .from('orders')
    .select('order_number')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!order) return platformMeta.sales
  return platformMeta.editSale(order.order_number)
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const platform = await createPlatformReadClient()
  if ('error' in platform) redirect('/login')
  const supabase = platform.supabase

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
