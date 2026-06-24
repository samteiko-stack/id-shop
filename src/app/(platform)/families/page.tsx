import { createClient } from '@/lib/supabase/server'
import { FamiliesClient } from './families-client'
import type { Category, ProductFamily } from '@/types'

export const metadata = { title: 'Product Families' }

const DEFAULT_PAGE_SIZE = 10

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page     = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? ''))
    ? parseInt(pageSizeParam!)
    : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const supabase = await createClient()

  const [familiesResult, categoriesResult] = await Promise.all([
    supabase
      .from('product_families')
      .select('id, name, category_id, image_url, display_order, created_at, updated_at, category:categories(id, name)', { count: 'exact' })
      .order('name')
      .range(from, to),
    supabase
      .from('categories')
      .select('id, name, parent_id')
      .is('deleted_at', null)
      .order('name'),
  ])

  const totalCount = familiesResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <FamiliesClient
      initialFamilies={(familiesResult.data as unknown as ProductFamily[]) ?? []}
      categories={(categoriesResult.data as Category[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize }}
    />
  )
}
