'use client'

import { NotificationBell } from '@/components/layout/notification-bell'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { User, Settings, LogOut, ChevronDown, Shield, ExternalLink } from '@/components/icons'
import Link from 'next/link'
import { useRole } from '@/hooks/use-role'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':        'Business Dashboard',
  '/products':         'Product Catalog',
  '/categories':       'Product Categories',
  '/subcategories':    'Product Sub-categories',
  '/families':         'Product Families',
  '/customers':        'Customer Accounts',
  '/orders':           'Sales & Orders',
  '/invoices':         'Invoices & Receivables',
  '/credit-invoices':  'Credit Notes',
  '/discount-groups':  'Discount Groups',
  '/programs':         'Training Programs',
  '/news':             'News & Content',
  '/traceability':     'LOT Traceability',
  '/reports':          'Sales & Inventory Reports',
  '/archive':          'Archive',
  '/users/audit-log':  'Audit Log',
  '/users':            'User Management',
  '/settings':         'Company Settings',
}

function getPageTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key))
  return match ? PAGE_TITLES[match] : 'ID Shop Admin'
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  admin:     'Administrator',
  staff:     'Staff',
  read_only: 'Read Only',
}

export function Topbar() {
  const pathname  = usePathname()
  const title     = getPageTitle(pathname)
  const { user, signOut } = useAuth()
  const { isAdmin } = useRole()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const displayName = user?.full_name ?? user?.email ?? ''
  const initials    = getInitials(displayName)
  const roleLabel   = ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? ''

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Notifications + user menu */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted',
            open && 'bg-muted',
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-36">
              {user?.full_name ?? user?.email}
            </p>
            <p className="text-xs text-muted-foreground leading-tight capitalize">{roleLabel}</p>
          </div>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform hidden sm:block', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden py-1">
              {/* User info header */}
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{user?.full_name ?? user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <Link
                href="/shop"
                target="_blank"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                View Site
              </Link>

              {isAdmin && (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  href="/users"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  User Management
                </Link>
              )}

              <div className="my-1 border-t border-border" />

              <button
                onClick={() => { setOpen(false); signOut() }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </header>
  )
}
