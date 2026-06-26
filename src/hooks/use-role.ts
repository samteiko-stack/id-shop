'use client'

import { getRolePermissions } from '@/lib/auth/role-utils'
import { useServerRole } from '@/components/auth/role-provider'
import { useAuth } from './use-auth'
import type { UserRole } from '@/types'

export function useRole() {
  const serverRole = useServerRole()
  const { user, loading } = useAuth()

  if (serverRole && loading) {
    return serverRole
  }

  const role = (user?.role ?? serverRole?.role ?? 'read_only') as UserRole
  return getRolePermissions(role)
}
