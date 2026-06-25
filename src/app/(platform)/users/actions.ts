'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { writeAuditLogWithAdmin } from '@/lib/audit'
import type { UserRole } from '@/types'
import { requireAdminAccess } from '@/lib/auth/permissions'

function appUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!url) throw new Error('NEXT_PUBLIC_APP_URL is not configured')
  return url
}

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

  const redirectTo = `${appUrl()}/auth/callback?next=${encodeURIComponent('/auth/update-password?flow=invite')}`

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, full_name },
    redirectTo,
  })

  if (error) return { error: error.message }

  await admin.from('users').upsert({
    id: data.user.id,
    email,
    full_name,
    role,
    is_active: false,
    invite_pending: true,
    updated_at: new Date().toISOString(),
  })

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: data.user.id,
      action: 'INSERT',
      newData: { email, full_name, role, invite_pending: true },
    },
    auth.userId
  )

  return { data: { userId: data.user.id } }
}

export async function revokeInvite(userId: string) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  if (userId === auth.userId) {
    return { error: 'You cannot revoke your own account.' }
  }

  const admin = await createAdminClient()

  const { data: user, error: fetchError } = await admin
    .from('users')
    .select('email, full_name, role, invite_pending')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!user) return { error: 'User not found.' }
  if (!user.invite_pending) {
    return { error: 'This user has already accepted their invite. Deactivate them instead.' }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) return { error: deleteError.message }

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: userId,
      action: 'DELETE',
      oldData: {
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        invite_pending: true,
      },
    },
    auth.userId
  )

  return {}
}

export async function activateInvitedUser() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = await createAdminClient()
  const { data: profile, error: fetchError } = await admin
    .from('users')
    .select('invite_pending, role')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!profile?.invite_pending) return {}

  const { error: updateError } = await admin
    .from('users')
    .update({
      is_active: true,
      invite_pending: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  await writeAuditLogWithAdmin(
    {
      tableName: 'users',
      recordId: user.id,
      action: 'UPDATE',
      oldData: { is_active: false, invite_pending: true },
      newData: { is_active: true, invite_pending: false },
    },
    user.id
  )

  return {}
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

  const { data: user } = await admin
    .from('users')
    .select('invite_pending')
    .eq('id', userId)
    .maybeSingle()

  if (user?.invite_pending && isActive) {
    return { error: 'This user has not accepted their invite yet.' }
  }

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
