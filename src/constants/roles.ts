import type { UserRole } from '@/types'

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  STAFF: 'staff' as UserRole,
  READ_ONLY: 'read_only' as UserRole,
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  read_only: 'Read Only',
  customer: 'Customer',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access to all modules, including user management and settings.',
  staff: 'Can create and edit orders, invoices, customers, and scan QR codes.',
  read_only: 'View-only access. Cannot create, edit, export, or perform any actions.',
  customer: 'Storefront customer. Can browse products and place orders.',
}

/* Roles that can write data */
export const WRITE_ROLES: UserRole[] = ['admin', 'staff']

/* Roles that can delete (soft) */
export const DELETE_ROLES: UserRole[] = ['admin']

/* Roles that can access admin-only sections */
export const ADMIN_ONLY_ROLES: UserRole[] = ['admin']
