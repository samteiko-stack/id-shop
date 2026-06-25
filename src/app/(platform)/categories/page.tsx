import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from './categories-client'
import type { Category } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.categories

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*, parent:categories!parent_id(id, name)')
    .is('deleted_at', null)
    .order('name')

  const all = (categories as Category[]) ?? []
  const topLevel = all.filter(c => !c.parent_id)
  const subcategories = all.filter(c => !!c.parent_id)

  return <CategoriesClient initialCategories={topLevel} subcategories={subcategories} />
}
