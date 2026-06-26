import { redirect } from 'next/navigation'
import { createPlatformReadClient } from '@/lib/supabase/platform-client'
import { getCachedCustomerOptions } from '@/lib/platform/cached-reference-data'
import { ArchiveClient } from './archive-client'
import {
  ARCHIVE_TYPES,
  isArchiveType,
  type ArchiveType,
  type ArchivedRow,
  type ArchivedSalesRow,
} from './types'
import type { Customer } from '@/types'
import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.archive

const DEFAULT_PAGE_SIZE = 10
const SALES_SELECT =
  'id, order_number, status, source, customer_id, created_at, deleted_at, customer:customers(id, name), items:order_items(quantity, unit_price)'

async function fetchArchivedRows(
  type: ArchiveType,
  from: number,
  to: number,
): Promise<{ rows: ArchivedRow[]; totalCount: number }> {
  const platform = await createPlatformReadClient()
  if ('error' in platform) return { rows: [], totalCount: 0 }
  const supabase = platform.supabase

  if (type === 'sales') {
    const { data, count } = await supabase
      .from('orders')
      .select(SALES_SELECT, { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    const rows: ArchivedSalesRow[] = (data ?? []).map((order: any) => {
      const orderTotal = (order.items ?? []).reduce(
        (sum: number, item: { quantity: number; unit_price: number }) =>
          sum + item.quantity * item.unit_price,
        0,
      )
      return {
        kind: 'sales',
        id: order.id,
        deleted_at: order.deleted_at,
        created_at: order.created_at,
        order_number: order.order_number,
        status: order.status,
        source: order.source,
        customer_name: order.customer?.name ?? null,
        customer_id: order.customer_id ?? null,
        order_total: orderTotal,
      }
    })

    return { rows, totalCount: count ?? 0 }
  }

  if (type === 'products') {
    const { data, count } = await supabase
      .from('products')
      .select('id, name, ref, deleted_at', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    return {
      rows: (data ?? []).map((row) => ({
        kind: 'products',
        id: row.id,
        deleted_at: row.deleted_at!,
        title: row.name,
        subtitle: row.ref,
      })),
      totalCount: count ?? 0,
    }
  }

  if (type === 'customers') {
    const { data, count } = await supabase
      .from('customers')
      .select('id, name, email, deleted_at', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    return {
      rows: (data ?? []).map((row) => ({
        kind: 'customers',
        id: row.id,
        deleted_at: row.deleted_at!,
        title: row.name,
        subtitle: row.email,
      })),
      totalCount: count ?? 0,
    }
  }

  if (type === 'categories') {
    const { data, count } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, deleted_at, parent:categories!parent_id(name)', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    return {
      rows: (data ?? []).map((row: any) => ({
        kind: 'categories',
        id: row.id,
        deleted_at: row.deleted_at,
        title: row.name,
        subtitle: row.parent?.name ? `Sub-category of ${row.parent.name}` : row.slug,
      })),
      totalCount: count ?? 0,
    }
  }

  if (type === 'discount-groups') {
    const { data, count } = await supabase
      .from('discount_groups')
      .select('id, name, discount_rate, deleted_at', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    return {
      rows: (data ?? []).map((row) => ({
        kind: 'discount-groups',
        id: row.id,
        deleted_at: row.deleted_at!,
        title: row.name,
        subtitle: `${row.discount_rate}% discount`,
      })),
      totalCount: count ?? 0,
    }
  }

  if (type === 'news') {
    const { data, count } = await supabase
      .from('news_posts')
      .select('id, title, slug, deleted_at', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    return {
      rows: (data ?? []).map((row) => ({
        kind: 'news',
        id: row.id,
        deleted_at: row.deleted_at!,
        title: row.title,
        subtitle: row.slug,
      })),
      totalCount: count ?? 0,
    }
  }

  const { data, count } = await supabase
    .from('courses')
    .select('id, title, slug, start_date, deleted_at', { count: 'exact' })
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .range(from, to)

  return {
    rows: (data ?? []).map((row) => ({
      kind: 'programs',
      id: row.id,
      deleted_at: row.deleted_at!,
      title: row.title,
      subtitle: row.start_date ? new Date(row.start_date).toLocaleDateString() : row.slug,
    })),
    totalCount: count ?? 0,
  }
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; pageSize?: string }>
}) {
  const { type: typeParam, page: pageParam, pageSize: pageSizeParam } = await searchParams
  const type: ArchiveType = typeParam && isArchiveType(typeParam) ? typeParam : 'sales'
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? ''))
    ? parseInt(pageSizeParam!)
    : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [{ rows, totalCount }, customers] = await Promise.all([
    fetchArchivedRows(type, from, to),
    type === 'sales' ? getCachedCustomerOptions() : Promise.resolve([]),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <ArchiveClient
      type={type}
      types={ARCHIVE_TYPES}
      rows={rows}
      customers={(customers as Customer[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize }}
    />
  )
}
