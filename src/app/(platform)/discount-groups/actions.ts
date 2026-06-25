'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { discountGroupSchema, type DiscountGroupInput } from '@/lib/validators'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'

export async function createDiscountGroup(input: DiscountGroupInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = discountGroupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { data, error } = await supabase
    .from('discount_groups')
    .insert(parsed.data)
    .select()
    .single()
  
  if (error) return { error: error.message }
  return { data }
}

export async function updateDiscountGroup(id: string, input: DiscountGroupInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = discountGroupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { data, error } = await supabase
    .from('discount_groups')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return { error: error.message }
  return { data }
}

export async function softDeleteDiscountGroup(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('discount_groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) return { error: error.message }
  revalidatePath('/discount-groups')
  revalidatePath('/archive')
  return { success: true }
}

export async function bulkArchiveDiscountGroups(ids: string[]) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('discount_groups')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)
  
  if (error) return { error: error.message }
  revalidatePath('/discount-groups')
  revalidatePath('/archive')
  return { success: true }
}

export async function restoreDiscountGroup(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: group } = await supabase
    .from('discount_groups')
    .select('id')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!group) return { error: 'Archived discount group not found' }

  const { error } = await supabase
    .from('discount_groups')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/discount-groups')
  revalidatePath('/archive')
  return {}
}
