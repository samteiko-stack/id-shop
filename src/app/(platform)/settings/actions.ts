'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdminAccess } from '@/lib/auth/permissions'

export async function saveCompanySettings(value: Record<string, string>) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString(), updated_by: auth.userId }).eq('key', 'company')
  if (error) return { error: error.message }
  return {}
}

export async function saveInvoiceSettings(value: Record<string, number>) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString(), updated_by: auth.userId }).eq('key', 'invoice')
  if (error) return { error: error.message }
  return {}
}
