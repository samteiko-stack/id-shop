'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ArrowRight } from '@/components/icons'

interface Order    { id: string; order_number: string; status: string; source?: string; created_at: string; customer?: { name: string } | null }
interface Invoice  { id: string; invoice_number: string; status: string; total: number; issue_date: string; customer?: { name: string } | null }
interface Customer { id: string; name: string; email?: string | null; org_number?: string | null; created_at: string }
interface Product  { id: string; name: string; ref: string; unit_price: number; is_active: boolean; category?: { name: string } | null }

interface Props {
  orders: Order[]
  invoices: Invoice[]
  customers: Customer[]
  products: Product[]
}

const TABS = [
  { key: 'orders',    label: 'Orders',    href: '/orders' },
  { key: 'invoices',  label: 'Invoices',  href: '/invoices' },
  { key: 'customers', label: 'Customers', href: '/customers' },
  { key: 'products',  label: 'Products',  href: '/products' },
] as const

type TabKey = typeof TABS[number]['key']

export function LatestFive({ orders, invoices, customers, products }: Props) {
  const [tab, setTab] = useState<TabKey>('orders')
  const currentTab = TABS.find(t => t.key === tab)!

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-0 border-b border-border">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link href={currentTab.href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Rows */}
      <div>
        {tab === 'orders' && (orders.length === 0 ? <Empty /> : orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`}
            className="grid grid-cols-[1fr_auto] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-600">#</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {o.customer?.name ?? '—'}
                  {o.source === 'storefront' ? ' · Storefront' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{formatDate(o.created_at)}</span>
              <StatusBadge status={o.status} />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )))}

        {tab === 'invoices' && (invoices.length === 0 ? <Empty /> : invoices.map((inv) => (
          <Link key={inv.id} href={`/invoices/${inv.id}`}
            className="grid grid-cols-[1fr_auto] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-600">€</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{inv.invoice_number}</p>
                <p className="text-xs text-muted-foreground">{inv.customer?.name ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.total)}</span>
              <StatusBadge status={inv.status} />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )))}

        {tab === 'customers' && (customers.length === 0 ? <Empty /> : customers.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`}
            className="grid grid-cols-[1fr_auto] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-orange-600">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.email ?? c.org_number ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )))}

        {tab === 'products' && (products.length === 0 ? <Empty /> : products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}
            className="grid grid-cols-[1fr_auto] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-violet-600">P</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">REF: {p.ref}{p.category ? ` · ${p.category.name}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{formatCurrency(p.unit_price)}</span>
              <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )))}
      </div>
    </div>
  )
}

function Empty() {
  return <div className="px-6 py-10 text-center text-sm text-muted-foreground">Nothing to show yet.</div>
}
