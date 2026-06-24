import { createClient } from '@/lib/supabase/server'
import { ShopClient } from './shop-client'
import { getCustomerDiscountRate } from '@/lib/storefront/customer-discount'
import { getCachedShopCatalog } from '@/lib/storefront/cached-queries'

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const isLoggedIn = !!user
  let isApproved = false
  let customerId: string | null = null

  let discountRate = 0

  if (user && user.user_metadata?.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('id, is_approved')
      .eq('auth_user_id', user.id)
      .single()
    isApproved = customer?.is_approved ?? false
    customerId = customer?.id ?? null
    if (customer?.id) {
      discountRate = await getCustomerDiscountRate(supabase, user.id)
    }
  }

  const { products, mainCategories, categories } = await getCachedShopCatalog()

  return (
    <ShopClient
      products={products}
      mainCategories={mainCategories}
      categories={categories}
      isLoggedIn={isLoggedIn}
      isApproved={isApproved}
      customerId={customerId}
      discountRate={discountRate}
    />
  )
}
