import { createCookieClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

type StorefrontCustomer = {
  id: string
  name: string
  is_approved: boolean
}

export type StorefrontAuthContext = {
  supabase: Awaited<ReturnType<typeof createCookieClient>>
  user: { id: string; email: string | undefined }
  role: UserRole
  customer: StorefrontCustomer | null
}

export async function getStorefrontAuthContext(): Promise<StorefrontAuthContext | null> {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_active === false) return null

  const role = (profile?.role ?? user.user_metadata?.role ?? 'read_only') as UserRole

  let customer: StorefrontCustomer | null = null
  if (role === 'customer') {
    const { data } = await supabase
      .from('customers')
      .select('id, name, is_approved')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    customer = data
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    role,
    customer,
  }
}
