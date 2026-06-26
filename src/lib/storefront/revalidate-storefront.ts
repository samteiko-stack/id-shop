import { revalidatePath, revalidateTag } from 'next/cache'
import { STOREFRONT_CACHE_TAGS } from '@/lib/storefront/cache-tags'

export function revalidateStorefrontCourses(slug?: string) {
  revalidateTag(STOREFRONT_CACHE_TAGS.courses)
  revalidatePath('/shop/programs')
  if (slug) revalidatePath(`/shop/programs/${slug}`)
}

export function revalidateStorefrontNews(slug?: string) {
  revalidateTag(STOREFRONT_CACHE_TAGS.news)
  revalidatePath('/shop/nyheter')
  if (slug) revalidatePath(`/shop/nyheter/${slug}`)
}

export function revalidateStorefrontProducts() {
  revalidateTag(STOREFRONT_CACHE_TAGS.products)
  revalidateTag(STOREFRONT_CACHE_TAGS.categories)
  revalidatePath('/shop')
  revalidatePath('/shop/kategori', 'layout')
  revalidatePath('/shop/products', 'layout')
}
