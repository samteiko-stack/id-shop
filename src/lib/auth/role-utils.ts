import { ADMIN_ONLY_ROLES, DELETE_ROLES, WRITE_ROLES } from '@/constants/roles'
import type { UserRole } from '@/types'

export function getRolePermissions(role: UserRole) {
  const isAdmin = role === 'admin'
  const isStaff = role === 'staff'
  const isReadOnly = role === 'read_only'

  const canWrite = WRITE_ROLES.includes(role)
  const canDelete = DELETE_ROLES.includes(role)
  const canManageUsers = ADMIN_ONLY_ROLES.includes(role)
  const canManageSettings = ADMIN_ONLY_ROLES.includes(role)
  const canViewAuditLog = ADMIN_ONLY_ROLES.includes(role)
  const canScanQR = canWrite
  const canCreateInvoice = canWrite
  const canCancelInvoice = isAdmin

  function hasRole(...roles: UserRole[]) {
    return roles.includes(role)
  }

  return {
    role,
    isAdmin,
    isStaff,
    isReadOnly,
    canWrite,
    canDelete,
    canManageUsers,
    canManageSettings,
    canViewAuditLog,
    canScanQR,
    canCreateInvoice,
    canCancelInvoice,
    hasRole,
  }
}

export type RolePermissions = ReturnType<typeof getRolePermissions>
