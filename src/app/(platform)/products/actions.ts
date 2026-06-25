'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { productSchema, productFamilySchema, type ProductInput, type ProductFamilyInput } from '@/lib/validators'
import { slugify } from '@/lib/utils'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateStorefrontProducts } from '@/lib/storefront/revalidate-storefront'
import { revalidateDashboard, revalidateCatalogReference } from '@/lib/platform/revalidate-platform'

export async function createProduct(input: ProductInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? 'root'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  return { data }
}

export async function updateProduct(id: string, input: ProductInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? 'root'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  return { data }
}

export async function softDeleteProduct(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  revalidatePath('/archive')
  return {}
}

export async function restoreProduct(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!product) return { error: 'Archived product not found' }

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  revalidatePath('/archive')
  return {}
}

/* ── Product Families ── */

export async function createProductFamily(input: ProductFamilyInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = productFamilySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_families')
    .insert(parsed.data)
    .select('id, name, category_id, image_url, display_order, category:categories(id, name)')
    .single()

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  return { data }
}

export async function updateProductFamily(id: string, input: ProductFamilyInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = productFamilySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_families')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, category_id, image_url, display_order, category:categories(id, name)')
    .single()

  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  return { data }
}

export async function deleteProductFamily(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('product_families').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateStorefrontProducts()
  revalidateDashboard()
  revalidateCatalogReference()
  revalidatePath('/products')
  return {}
}
