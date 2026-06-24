export const PLATFORM_CACHE_TAGS = {
  dashboard: 'platform-dashboard',
} as const

/**
 * Fallback TTL when a mutation misses revalidateTag (e.g. direct DB edit).
 * Shorter than storefront — dashboard includes time-bound stats.
 */
export const DASHBOARD_CACHE_REVALIDATE = 300 // 5 minutes fallback
