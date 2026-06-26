'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { customerSchema, type CustomerInput } from '@/lib/validators'
import { requireDeleteAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard, revalidateCustomerReference } from '@/lib/platform/revalidate-platform'
import {
  getCustomerArchiveBlockers,
  getCustomerRestoreBlockers,
} from '@/lib/platform/archive-guards'

export async function createCustomer(input: CustomerInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const { data, error } = await supabase.from('customers').insert(parsed.data).select().single()
  if (error) return { error: error.message }
  revalidateDashboard()
  revalidateCustomerReference()
  return { data }
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = await createClient()
  const { data, error } = await supabase.from('customers').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return { error: error.message }
  revalidateDashboard()
  revalidateCustomerReference()
  return { data }
}

export async function softDeleteCustomer(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const blockers = await getCustomerArchiveBlockers(supabase, id)
  if (blockers.error) return { error: blockers.error }

  const { error } = await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }
  revalidateDashboard()
  revalidateCustomerReference()
  revalidatePath('/archive')
  return {}
}

export async function restoreCustomer(id: string) {
  const auth = await requireDeleteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', id)
    .not('deleted_at', 'is', null)
    .single()

  if (!customer) return { error: 'Archived customer not found' }

  const blockers = await getCustomerRestoreBlockers(supabase, id)
  if (blockers.error) return { error: blockers.error }

  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateDashboard()
  revalidateCustomerReference()
  revalidatePath('/customers')
  revalidatePath('/archive')
  return {}
}
