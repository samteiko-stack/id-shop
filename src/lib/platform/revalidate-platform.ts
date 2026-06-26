import { revalidatePath, revalidateTag } from 'next/cache'
import { PLATFORM_CACHE_TAGS } from '@/lib/platform/cache-tags'

export function revalidateDashboard() {
  revalidateTag(PLATFORM_CACHE_TAGS.dashboard)
  revalidatePath('/dashboard')
  revalidatePath('/orders')
}

export function revalidateCustomerReference() {
  revalidateTag(PLATFORM_CACHE_TAGS.customers)
}

export function revalidateCatalogReference() {
  revalidateTag(PLATFORM_CACHE_TAGS.categories)
  revalidateTag(PLATFORM_CACHE_TAGS.families)
}

export function revalidateDiscountGroupReference() {
  revalidateTag(PLATFORM_CACHE_TAGS.discountGroups)
}
