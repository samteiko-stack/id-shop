import { revalidatePath, revalidateTag } from 'next/cache'
import { PLATFORM_CACHE_TAGS } from '@/lib/platform/cache-tags'

export function revalidateDashboard() {
  revalidateTag(PLATFORM_CACHE_TAGS.dashboard)
  revalidatePath('/dashboard')
  revalidatePath('/orders')
}
