import { createClient } from '@/lib/supabase/server'
import { ArchiveOrdersClient } from './archive-client'
import { getCachedCustomerOptions } from '@/lib/platform/cached-reference-data'
import type { Customer } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.archivedSales

const DEFAULT_PAGE_SIZE = 10

const ARCHIVED_ORDER_SELECT =
  'id, order_number, status, source, customer_id, created_at, deleted_at, customer:customers(id, name), items:order_items(quantity, unit_price)'

export default async function ArchivedOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? ''))
    ? parseInt(pageSizeParam!)
    : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const [ordersResult, customers] = await Promise.all([
    supabase
      .from('orders')
      .select(ARCHIVED_ORDER_SELECT, { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to),
    getCachedCustomerOptions(),
  ])

  const orders = (ordersResult.data ?? []).map((order: any) => {
    const itemsSubtotal = (order.items ?? []).reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0,
    )
    return {
      ...order,
      order_total: itemsSubtotal,
    }
  })

  const totalCount = ordersResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <ArchiveOrdersClient
      initialOrders={orders}
      customers={(customers as Customer[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize }}
    />
  )
}
