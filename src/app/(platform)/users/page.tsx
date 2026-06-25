import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserManagementClient } from './user-management-client'
import type { User } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.users

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  const role = authUser?.user_metadata?.role
  if (role !== 'admin') redirect('/dashboard')

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_active, invite_pending, created_at, updated_at')
    .neq('role', 'customer')
    .order('created_at', { ascending: false })

  return (
    <UserManagementClient
      initialUsers={(users as User[]) ?? []}
      error={error?.message}
    />
  )
}
