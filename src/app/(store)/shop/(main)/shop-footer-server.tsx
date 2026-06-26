import { ShopFooter } from './shop-footer'
import { getCachedFooterCategories } from '@/lib/storefront/cached-queries'

export async function ShopFooterServer() {
  const categoryGroups = await getCachedFooterCategories()
  return <ShopFooter categoryGroups={categoryGroups} />
}
