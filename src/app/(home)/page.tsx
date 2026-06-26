import { shopMeta } from '@/lib/metadata'
import { createClient } from '@/lib/supabase/server'
import { HomepageClient } from '@/app/(store)/shop/(main)/homepage-client'
import { getStorefrontCustomerPropsWithDiscount } from '@/lib/storefront/auth-context'

export const metadata = shopMeta.home

export default async function HomePage() {
  const supabase = await createClient()
  const { isLoggedIn, discountRate } = await getStorefrontCustomerPropsWithDiscount()

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, ref, unit_price, currency, image_url, category_id, categories(id, name)')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const { data: topCategories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('name')

  const products = (featuredProducts ?? []).map((p: any) => ({
    ...p,
    categories: Array.isArray(p.categories) ? p.categories[0] ?? null : p.categories,
  }))

  return (
    <HomepageClient
      featuredProducts={products}
      topCategories={topCategories ?? []}
      isLoggedIn={isLoggedIn}
      discountRate={discountRate}
    />
  )
}
