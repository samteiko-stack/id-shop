'use client'

import { createContext, useContext } from 'react'
import type { UserRole } from '@/types'
import { getRolePermissions, type RolePermissions } from '@/lib/auth/role-utils'

const RoleContext = createContext<RolePermissions | null>(null)

export function RoleProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return (
    <RoleContext.Provider value={getRolePermissions(role)}>
      {children}
    </RoleContext.Provider>
  )
}

export function useServerRole() {
  return useContext(RoleContext)
}
