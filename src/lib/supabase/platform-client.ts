import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/permissions'
import { PLATFORM_ROLES } from '@/constants/roles'
import type { UserRole } from '@/types'

export type PlatformAuth = {
  supabase: Awaited<ReturnType<typeof createAdminClient>>
  userId: string
  role: UserRole
}

/** Admin client for platform reads after verifying staff/admin/read-only role. */
export async function createPlatformReadClient(): Promise<PlatformAuth | { error: string }> {
  const auth = await getCurrentUserRole()
  if ('error' in auth) return { error: auth.error }
  if (!PLATFORM_ROLES.includes(auth.role)) return { error: 'Forbidden' }

  const supabase = await createAdminClient()
  return { supabase, userId: auth.userId, role: auth.role }
}
