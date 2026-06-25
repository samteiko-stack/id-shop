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
  Archive,
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
      { label: 'Archive', href: '/orders/archive', icon: Archive, roles: ['admin', 'staff'] },
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
      <div className="py-0.5">
        <div className="flex items-center gap-2 px-2.5 py-1 text-[13px] font-semibold leading-tight text-white">
          <item.icon className="h-3.5 w-3.5 shrink-0 text-white/55" />
          {item.label}
        </div>
        <div className="ml-3 pl-2 border-l border-white/15 space-y-px">
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
        'flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] font-semibold leading-tight transition-colors',
        level === 0 ? 'text-white' : 'text-white/60',
        isExactActive
          ? 'bg-white/10 text-white border-l-2 border-primary -ml-px pl-[calc(0.625rem-1px)]'
          : 'hover:bg-white/10 hover:text-white'
      )}
    >
      <item.icon className={cn('h-3.5 w-3.5 shrink-0', isExactActive ? 'text-primary' : 'text-white/55')} />
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
      <div className="flex items-center gap-2 px-3 h-12 border-b border-white/10 shrink-0">
        <img src="/logo-white.png" alt="ID Shop" className="h-6 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-px min-h-0">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-white/10" />
            <p className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Admin
            </p>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-2 py-2 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-white text-[10px] font-semibold shrink-0">
            {getInitials(user?.full_name ?? user?.email ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white truncate leading-tight">
              {user?.full_name ?? user?.email}
            </p>
            <p className="text-[10px] text-white/50 truncate capitalize leading-tight">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </BrandSurface>
  )
}
