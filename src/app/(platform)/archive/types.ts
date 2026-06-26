export const ARCHIVE_TYPES = [
  { id: 'sales', label: 'Sales' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'categories', label: 'Categories' },
  { id: 'discount-groups', label: 'Discount Groups' },
  { id: 'news', label: 'News' },
  { id: 'programs', label: 'Programs' },
] as const

export type ArchiveType = (typeof ARCHIVE_TYPES)[number]['id']

export function isArchiveType(value: string): value is ArchiveType {
  return ARCHIVE_TYPES.some((t) => t.id === value)
}

export interface ArchivedSalesRow {
  kind: 'sales'
  id: string
  deleted_at: string
  created_at: string
  order_number: string
  status: string
  source: string
  customer_name: string | null
  customer_id: string | null
  order_total: number
}

export interface ArchivedGenericRow {
  kind: Exclude<ArchiveType, 'sales'>
  id: string
  deleted_at: string
  title: string
  subtitle: string | null
}

export type ArchivedRow = ArchivedSalesRow | ArchivedGenericRow

export interface ArchivePagination {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}
