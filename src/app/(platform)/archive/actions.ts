'use server'

import { revalidatePath } from 'next/cache'
import { restoreOrder } from '@/app/(platform)/orders/actions'
import { restoreProduct } from '@/app/(platform)/products/actions'
import { restoreCustomer } from '@/app/(platform)/customers/actions'
import { restoreCategory } from '@/app/(platform)/categories/actions'
import { restoreDiscountGroup } from '@/app/(platform)/discount-groups/actions'
import { restoreNewsPost } from '@/app/(platform)/news/actions'
import { restoreCourse } from '@/app/(platform)/programs/actions'
import type { ArchiveType } from './types'

function revalidateArchive(type: ArchiveType) {
  revalidatePath('/archive')
  switch (type) {
    case 'sales':
      revalidatePath('/orders')
      break
    case 'products':
      revalidatePath('/products')
      break
    case 'customers':
      revalidatePath('/customers')
      break
    case 'categories':
      revalidatePath('/categories')
      revalidatePath('/subcategories')
      break
    case 'discount-groups':
      revalidatePath('/discount-groups')
      break
    case 'news':
      revalidatePath('/news')
      break
    case 'programs':
      revalidatePath('/programs')
      break
  }
}

export async function restoreArchivedItem(type: ArchiveType, id: string) {
  let result: { error?: string }

  switch (type) {
    case 'sales':
      result = await restoreOrder(id)
      break
    case 'products':
      result = await restoreProduct(id)
      break
    case 'customers':
      result = await restoreCustomer(id)
      break
    case 'categories':
      result = await restoreCategory(id)
      break
    case 'discount-groups':
      result = await restoreDiscountGroup(id)
      break
    case 'news':
      result = await restoreNewsPost(id)
      break
    case 'programs':
      result = await restoreCourse(id)
      break
    default:
      return { error: 'Unknown archive type' }
  }

  if (!result.error) revalidateArchive(type)
  return result
}

export async function restoreArchivedItems(
  type: ArchiveType,
  ids: string[],
): Promise<{ error?: string }> {
  const errors: string[] = []
  for (const id of ids) {
    const result = await restoreArchivedItem(type, id)
    if (result.error) errors.push(result.error)
  }
  if (errors.length > 0) return { error: errors[0] }
  return {}
}
