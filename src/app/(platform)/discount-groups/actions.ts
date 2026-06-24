'use server'

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
  return { success: true }
}
