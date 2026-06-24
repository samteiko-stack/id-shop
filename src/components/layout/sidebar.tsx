'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import { BrandSurface } from '@/components/storefront/brand-surface'
import {
  LayoutDashboard,
  Package,
  Tag,
  Tags,
  Layers,
  Users,
  ShoppingCart,
  FileText,
  FileMinus,
  QrCode,
  BarChart3,
  GraduationCap,
  Newspaper,
  UserCog,
  Settings,
  LogOut,
  Percent,
} from '@/components/icons'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Revenue',
    href: '/orders',
    icon: ShoppingCart,
    children: [
      { label: 'Sales', href: '/orders', icon: ShoppingCart },
      { label: 'Invoices', href: '/invoices', icon: FileText },
      { label: 'Credit Invoices', href: '/credit-invoices', icon: FileMinus, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Catalog',
    href: '/products',
    icon: Package,
    children: [
      { label: 'Products',       href: '/products',       icon: Package },
      { label: 'Categories',     href: '/categories',     icon: Tag },
      { label: 'Sub-categories', href: '/subcategories',  icon: Tags },
      { label: 'Families',       href: '/families',       icon: Layers },
    ],
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    children: [
      { label: 'All Customers', href: '/customers', icon: Users },
      { label: 'Discount Groups', href: '/discount-groups', icon: Percent },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    icon: GraduationCap,
  },
  {
    label: 'News',
    href: '/news',
    icon: Newspaper,
  },
  {
    label: 'Traceability',
    href: '/traceability',
    icon: QrCode,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
]

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Users', href: '/users', icon: UserCog, roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
]

function NavLink({
  item,
  level = 0,
}: {
  item: NavItem
  level?: number
}) {
  const pathname = usePathname()
  const { role } = useRole()

  if (item.roles && !item.roles.includes(role)) return null

  if (item.children) {
    return (
      <div>
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-white">
          <item.icon className="h-4 w-4 shrink-0 text-white/55" />
          {item.label}
        </div>
        <div className="mt-1 ml-4 pl-3 border-l border-white/15 space-y-0.5">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} level={1} />
          ))}
        </div>
      </div>
    )
  }

  const isExactActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors',
        level === 0 ? 'text-white' : 'text-white/60',
        isExactActive
          ? 'bg-white/10 text-white border-l-2 border-primary -ml-px pl-[calc(0.75rem-1px)]'
          : 'hover:bg-white/10 hover:text-white'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', isExactActive ? 'text-primary' : 'text-white/55')} />
      {item.label}
    </Link>
  )
}

export function Sidebar() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useRole()

  return (
    <BrandSurface
      as="aside"
      className="hidden md:flex flex-col h-full w-64 shrink-0 border-r border-white/10"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <img src="/logo-white.png" alt="ID Shop" className="h-7 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 min-h-0">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-white/45">
              Admin
            </p>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white text-xs font-semibold shrink-0">
            {getInitials(user?.full_name ?? user?.email ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {user?.full_name ?? user?.email}
            </p>
            <p className="text-xs text-white/50 truncate capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </BrandSurface>
  )
}
