import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShopProductClient } from './shop-product-client'
import { getCustomerDiscountRate } from '@/lib/storefront/customer-discount'
import { getCachedShopProduct } from '@/lib/storefront/cached-queries'

async function getCustomerContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.user_metadata?.role !== 'customer') {
    return { isLoggedIn: !!user, isApproved: false, customerId: null as string | null, discountRate: 0 }
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, is_approved')
    .eq('auth_user_id', user.id)
    .single()

  const discountRate = await getCustomerDiscountRate(supabase, user.id)

  return {
    isLoggedIn: true,
    isApproved: customer?.is_approved ?? false,
    customerId: customer?.id ?? null,
    discountRate,
  }
}

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [cached, customerContext] = await Promise.all([
    getCachedShopProduct(id),
    getCustomerContext(),
  ])

  if (!cached) notFound()

  const { product, related } = cached
  const { isLoggedIn, isApproved, customerId, discountRate } = customerContext

  return (
    <ShopProductClient
      product={product as any}
      related={related as any[]}
      isLoggedIn={isLoggedIn}
      isApproved={isApproved}
      customerId={customerId}
      discountRate={discountRate}
    />
  )
}
