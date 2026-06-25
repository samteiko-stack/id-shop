import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.settings

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.role !== 'admin') redirect('/dashboard')

  const { data: companySettings } = await supabase.from('settings').select('value').eq('key', 'company').single()
  const { data: invoiceSettings } = await supabase.from('settings').select('value').eq('key', 'invoice').single()

  return (
    <SettingsClient
      companySettings={(companySettings?.value as any) ?? {}}
      invoiceSettings={(invoiceSettings?.value as any) ?? {}}
    />
  )
}
