import type { UserRole } from '@/types'

export const PUBLIC_ROUTES = ['/login', '/reset-password', '/shop', '/auth']
export const PUBLIC_EXACT = ['/']
export const SHOP_AUTH_ROUTES = ['/shop/login', '/shop/register', '/shop/pending']

export const AUTH_REDIRECT = '/login'
export const DEFAULT_REDIRECT = '/dashboard'
export const SHOP_AUTH_REDIRECT = '/shop/login'
export const SHOP_DEFAULT_REDIRECT = '/shop'

/** Platform areas read-only users may view (no create/edit routes). */
const READ_ONLY_PREFIXES = [
  '/dashboard',
  '/products',
  '/categories',
  '/subcategories',
  '/families',
  '/customers',
  '/discount-groups',
  '/invoices',
  '/orders',
  '/reports',
  '/programs',
  '/news',
  '/traceability',
]

/** Staff-only areas (admin also has access). */
const STAFF_ONLY_PREFIXES = [
  '/credit-invoices',
]

const ADMIN_ONLY_PREFIXES = ['/users', '/settings']

const WRITE_PATH = /\/(new|edit|print)(\/|$)/

export function hasRouteAccess(pathname: string, role: UserRole): boolean {
  if (role === 'admin') return true

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) return false

  if (WRITE_PATH.test(pathname)) return false

  if (role === 'staff') return true

  if (role === 'read_only') {
    if (STAFF_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) return false
    return READ_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  return false
}

export function hasApiAccess(pathname: string, role: UserRole): boolean {
  if (role === 'admin') return true

  if (role === 'read_only') {
    return (
      pathname.startsWith('/api/traceability/search') ||
      pathname.startsWith('/api/reports')
    )
  }

  if (role === 'staff') {
    if (pathname.startsWith('/api/users') || pathname.startsWith('/api/settings')) return false
    return true
  }

  if (role === 'customer') {
    return pathname.startsWith('/api/storefront/')
  }

  return false
}
