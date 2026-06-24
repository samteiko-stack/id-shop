import { createClient } from '@/lib/supabase/server'
import { TraceabilityClient } from './traceability-client'

export const metadata = { title: 'Traceability' }

export default async function TraceabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; lot?: string; ref?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch open orders for the scan workflow
  const { data: openOrders } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer:customers(name),
      items:order_items(
        id, product_id, quantity,
        product:products(id, name, ref),
        batches:order_item_batches(quantity)
      )
    `)
    .in('status', ['confirmed'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <TraceabilityClient
      openOrders={(openOrders as any[]) ?? []}
      initialOrderId={params.order}
      initialSearch={params.lot || params.ref || ''}
    />
  )
}
