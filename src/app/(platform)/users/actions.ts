'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { writeAuditLogWithAdmin } from '@/lib/audit'
import type { UserRole } from '@/types'
import { requireAdminAccess } from '@/lib/auth/permissions'

export async function inviteUser({
  email,
  full_name,
  role,
}: {
  email: string
  full_name: string
  role: UserRole
}) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = await createAdminClient()

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) return { error: error.message }

  await admin.from('users').upsert({
    id: data.user.id,
    email,
    full_name,
    role,
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: data.user.id,
      action: 'INSERT',
      newData: { email, full_name, role },
    },
    auth.userId
  )

  return { data: { userId: data.user.id } }
}

export async function updateUserRole(userId: string, role: UserRole) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = await createAdminClient()

  // Update auth metadata (used in RLS)
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  })
  if (authError) return { error: authError.message }

  // Update public users table (source of truth for UI)
  const { data: prevUser } = await admin.from('users').select('role').eq('id', userId).single()

  const { error: dbError } = await admin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (dbError) return { error: dbError.message }

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: userId,
      action: 'UPDATE',
      oldData: { role: prevUser?.role },
      newData: { role },
    },
    auth.userId
  )

  return {}
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = await createAdminClient()

  const { error } = await admin
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { error: error.message }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : '876000h',
  })
  if (authError) return { error: authError.message }

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: userId,
      action: 'UPDATE',
      oldData: { is_active: !isActive },
      newData: { is_active: isActive },
    },
    auth.userId
  )

  return {}
}
