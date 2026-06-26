import { redirect } from 'next/navigation'
import { createCookieClient } from '@/lib/supabase/server'
import type { Customer } from '@/types'

type CustomerSessionResult =
  | { error: string; supabase?: undefined; user?: undefined; customer?: undefined }
  | { supabase: Awaited<ReturnType<typeof createCookieClient>>; user: { id: string; email: string | undefined }; customer: Customer }

export async function requireStorefrontCustomer(): Promise<CustomerSessionResult> {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_active === false) {
    return { error: 'Not authenticated' }
  }

  const role = profile?.role ?? user.user_metadata?.role
  if (role !== 'customer') {
    return { error: 'Not authenticated' }
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !customer) {
    return { error: 'Customer record not found' }
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    customer: customer as Customer,
  }
}

/** Use in server pages — sends platform users to /dashboard, others to shop login. */
export async function requireStorefrontCustomerOrRedirect(redirectTo = '/shop/konto') {
  const session = await requireStorefrontCustomer()
  if ('error' in session) {
    const supabase = await createCookieClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      const role = profile?.role ?? user.user_metadata?.role
      if (role !== 'customer') {
        redirect('/dashboard')
      }
    }
    redirect(`/shop/login?redirectTo=${redirectTo}`)
  }
  return session
}
