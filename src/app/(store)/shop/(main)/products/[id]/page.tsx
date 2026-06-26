import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { shopMeta } from '@/lib/metadata'
import { ShopProductClient } from './shop-product-client'
import { getCachedShopProduct } from '@/lib/storefront/cached-queries'
import { getStorefrontCustomerPropsWithDiscount } from '@/lib/storefront/auth-context'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const cached = await getCachedShopProduct(id)
  if (!cached) return shopMeta.catalog
  const { product } = cached
  return shopMeta.product(product.name, product.ref)
}

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [cached, customerContext] = await Promise.all([
    getCachedShopProduct(id),
    getStorefrontCustomerPropsWithDiscount(),
  ])

  if (!cached) notFound()

  const { product, related } = cached
  const { isLoggedIn, isApproved, customerId, discountRate, shopBanner } = customerContext

  return (
    <ShopProductClient
      product={product as any}
      related={related as any[]}
      isLoggedIn={isLoggedIn}
      isApproved={isApproved}
      customerId={customerId}
      discountRate={discountRate}
      shopBanner={shopBanner}
    />
  )
}
