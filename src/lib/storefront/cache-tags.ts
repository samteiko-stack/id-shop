export const STOREFRONT_CACHE_TAGS = {
  courses: 'storefront-courses',
  news: 'storefront-news',
  categories: 'storefront-categories',
  products: 'storefront-products',
} as const

/**
 * Fallback TTL when a mutation misses revalidateTag (e.g. direct DB edit).
 * Primary strategy is still tag invalidation from admin actions.
 */
export const STOREFRONT_CACHE_REVALIDATE = 86_400 // 24 hours
