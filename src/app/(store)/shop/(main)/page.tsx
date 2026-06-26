import { shopMeta } from '@/lib/metadata'
import { ShopClient } from './shop-client'
import { getCachedShopCatalog } from '@/lib/storefront/cached-queries'
import { getStorefrontCustomerPropsWithDiscount } from '@/lib/storefront/auth-context'

export const metadata = shopMeta.catalog

export default async function ShopPage() {
  const [{ isLoggedIn, isApproved, customerId, discountRate, shopBanner }, catalog] = await Promise.all([
    getStorefrontCustomerPropsWithDiscount(),
    getCachedShopCatalog(),
  ])

  const { products, mainCategories, categories } = catalog

  return (
    <ShopClient
      products={products}
      mainCategories={mainCategories}
      categories={categories}
      isLoggedIn={isLoggedIn}
      isApproved={isApproved}
      customerId={customerId}
      discountRate={discountRate}
      shopBanner={shopBanner}
    />
  )
}
