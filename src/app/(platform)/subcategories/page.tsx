import { createClient } from '@/lib/supabase/server'
import { SubcategoriesClient } from './subcategories-client'
import type { Category } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.subcategories

const DEFAULT_PAGE_SIZE = 10

export default async function SubcategoriesPage({
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

  const [subResult, topResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*, parent:categories!parent_id(id, name)', { count: 'exact' })
      .not('parent_id', 'is', null)
      .is('deleted_at', null)
      .order('name')
      .range(from, to),
    supabase
      .from('categories')
      .select('id, name')
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('name'),
  ])

  const totalCount = subResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <SubcategoriesClient
      initialSubcategories={(subResult.data as Category[]) ?? []}
      topLevelCategories={(topResult.data as Category[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize }}
    />
  )
}
