import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { PLATFORM_CACHE_TAGS, REFERENCE_CACHE_REVALIDATE } from '@/lib/platform/cache-tags'

export async function getCachedCustomerOptions() {
  return unstable_cache(
    async () => {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      return data ?? []
    },
    ['platform-customer-options'],
    { revalidate: REFERENCE_CACHE_REVALIDATE, tags: [PLATFORM_CACHE_TAGS.customers] },
  )()
}

export async function getCachedCategoryOptions() {
  return unstable_cache(
    async () => {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .is('deleted_at', null)
        .order('name')
      return data ?? []
    },
    ['platform-category-options'],
    { revalidate: REFERENCE_CACHE_REVALIDATE, tags: [PLATFORM_CACHE_TAGS.categories] },
  )()
}

export async function getCachedProductFamilies() {
  return unstable_cache(
    async () => {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('product_families')
        .select('id, name, category_id, image_url, display_order, category:categories(id, name)')
        .order('name')
      return data ?? []
    },
    ['platform-product-families'],
    { revalidate: REFERENCE_CACHE_REVALIDATE, tags: [PLATFORM_CACHE_TAGS.families] },
  )()
}

export async function getCachedDiscountGroups() {
  return unstable_cache(
    async () => {
      const supabase = await createAdminClient()
      const { data } = await supabase
        .from('discount_groups')
        .select('id, name, discount_rate')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name')
      return data ?? []
    },
    ['platform-discount-groups'],
    { revalidate: REFERENCE_CACHE_REVALIDATE, tags: [PLATFORM_CACHE_TAGS.discountGroups] },
  )()
}
