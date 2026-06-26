'use client'

import Link from 'next/link'
import {
  ShoppingCart, FileText, Package, Users, BarChart2,
  Settings, ScanLine, CreditCard,
} from '@/components/icons'
import { useRole } from '@/hooks/use-role'

const LINKS = [
  { label: 'Sales',        href: '/orders',          icon: ShoppingCart, cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { label: 'Invoices',     href: '/invoices',        icon: FileText,     cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { label: 'Products',     href: '/products',        icon: Package,      cls: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  { label: 'Customers',    href: '/customers',       icon: Users,        cls: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  { label: 'Credit Notes', href: '/credit-invoices', icon: CreditCard,   cls: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40', staffOnly: true },
  { label: 'Traceability', href: '/traceability',    icon: ScanLine,     cls: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  { label: 'Reports',      href: '/reports',         icon: BarChart2,    cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { label: 'Settings',     href: '/settings',        icon: Settings,     cls: 'text-slate-600 bg-slate-100 dark:bg-slate-800/60', adminOnly: true },
]

export function QuickLinks() {
  const { canWrite, isAdmin } = useRole()

  const visibleLinks = LINKS.filter((link) => {
    if (link.adminOnly && !isAdmin) return false
    if (link.staffOnly && !canWrite) return false
    return true
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {visibleLinks.map(({ label, href, icon: Icon, cls }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-background p-4 text-center hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm transition-all duration-150"
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cls} transition-transform group-hover:scale-105`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
        </Link>
      ))}
    </div>
  )
}
