import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomepageClient } from '@/app/(store)/shop/(main)/homepage-client'
import { getCustomerDiscountRate } from '@/lib/storefront/customer-discount'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const isLoggedIn = !!user
  let discountRate = 0

  if (user?.user_metadata?.role === 'customer') {
    discountRate = await getCustomerDiscountRate(supabase, user.id)
  }

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
