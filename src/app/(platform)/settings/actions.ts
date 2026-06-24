'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdminAccess } from '@/lib/auth/permissions'

async function invalidateAllInvoicePdfs(supabase: Awaited<ReturnType<typeof createClient>>) {
  await supabase.from('invoices').update({ pdf_url: null }).not('pdf_url', 'is', null)
}

export async function saveCompanySettings(value: Record<string, string>) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString(), updated_by: auth.userId }).eq('key', 'company')
  if (error) return { error: error.message }

  await invalidateAllInvoicePdfs(supabase)
  return {}
}

export async function saveInvoiceSettings(value: Record<string, number>) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString(), updated_by: auth.userId }).eq('key', 'invoice')
  if (error) return { error: error.message }

  await invalidateAllInvoicePdfs(supabase)
  return {}
}
