import type { SupabaseClient } from '@supabase/supabase-js'

export type FooterCategoryGroup = {
  id: string
  name: string
  slug: string
  subcategories: { id: string; name: string; slug: string }[]
}

export async function getFooterCategoryGroups(
  supabase: SupabaseClient
): Promise<FooterCategoryGroup[]> {
  const [{ data: topCategories }, { data: subCategories }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .not('parent_id', 'is', null)
      .is('deleted_at', null)
      .order('name'),
  ])

  const subsByParent = new Map<string, { id: string; name: string; slug: string }[]>()
  for (const sub of subCategories ?? []) {
    if (!sub.parent_id) continue
    const list = subsByParent.get(sub.parent_id) ?? []
    list.push({ id: sub.id, name: sub.name, slug: sub.slug })
    subsByParent.set(sub.parent_id, list)
  }

  return (topCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    subcategories: subsByParent.get(cat.id) ?? [],
  }))
}
