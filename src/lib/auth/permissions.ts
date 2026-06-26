import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'
import { ADMIN_ONLY_ROLES, DELETE_ROLES, WRITE_ROLES } from '@/constants/roles'

type AuthSuccess = { userId: string; role: UserRole }

export async function getCurrentUserRole(): Promise<AuthSuccess | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_active === false) return { error: 'Account deactivated' }

  const role = (profile?.role ?? user.user_metadata?.role ?? 'read_only') as UserRole

  return { userId: user.id, role }
}

export async function requireWriteAccess(): Promise<AuthSuccess | { error: string }> {
  const auth = await getCurrentUserRole()
  if ('error' in auth) return auth
  if (!WRITE_ROLES.includes(auth.role)) return { error: 'Forbidden' }
  return auth
}

export async function requireAdminAccess(): Promise<AuthSuccess | { error: string }> {
  const auth = await getCurrentUserRole()
  if ('error' in auth) return auth
  if (!ADMIN_ONLY_ROLES.includes(auth.role)) return { error: 'Forbidden' }
  return auth
}

export async function requireDeleteAccess(): Promise<AuthSuccess | { error: string }> {
  const auth = await getCurrentUserRole()
  if ('error' in auth) return auth
  if (!DELETE_ROLES.includes(auth.role)) return { error: 'Forbidden' }
  return auth
}
