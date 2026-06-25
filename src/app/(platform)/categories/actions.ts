'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { categorySchema, type CategoryInput } from '@/lib/validators'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateStorefrontProducts } from '@/lib/storefront/revalidate-storefront'
import { revalidateCatalogReference } from '@/lib/platform/revalidate-platform'

export async function createCategory(input: CategoryInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').insert(parsed.data).select().single()
  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateCatalogReference()
  revalidatePath('/categories')
  revalidatePath('/products')
  return { data }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateCatalogReference()
  revalidatePath('/categories')
  revalidatePath('/products')
  return { data }
}

export async function softDeleteCategory(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateCatalogReference()
  revalidatePath('/archive')
  return {}
}

export async function restoreCategory(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!category) return { error: 'Archived category not found' }

  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateCatalogReference()
  revalidatePath('/categories')
  revalidatePath('/subcategories')
  revalidatePath('/archive')
  return {}
}
