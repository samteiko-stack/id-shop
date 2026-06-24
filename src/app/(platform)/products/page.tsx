import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'
import type { Product, Category, ProductFamily } from '@/types'

export const metadata = { title: 'Products' }

const DEFAULT_PAGE_SIZE = 10

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; tab?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam, tab } = await searchParams
  const page     = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? '')) ? parseInt(pageSizeParam!) : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const supabase = await createClient()
  const [productsResult, categoriesResult, familiesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, ref, description, category_id, family_id, unit_price, currency, is_active, image_url, product_family, display_order, brand, created_at, updated_at, category:categories(id, name)', { count: 'exact' })
      .is('deleted_at', null)
      .order('name')
      .range(from, to),
    supabase.from('categories').select('id, name, parent_id').is('deleted_at', null).order('name'),
    supabase.from('product_families').select('id, name, category_id, image_url, display_order, category:categories(id, name)').order('name'),
  ])

  const totalCount = productsResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <ProductsClient
      initialProducts={(productsResult.data as unknown as Product[]) ?? []}
      categories={(categoriesResult.data as Category[]) ?? []}
      families={(familiesResult.data as unknown as ProductFamily[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize }}
    />
  )
}
