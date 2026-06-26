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

function RowLink({
  href,
  title,
  subtitle,
  meta,
  trailing,
}: {
  href: string
  title: string
  subtitle?: string
  meta?: string
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-b border-border/70 px-4 py-2.5 last:border-0 hover:bg-muted/35"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta ? <span className="hidden text-[11px] text-muted-foreground sm:inline">{meta}</span> : null}
        {trailing}
        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}

export function LatestFive({ orders, invoices, customers, products }: Props) {
  const [tab, setTab] = useState<TabKey>('orders')
  const currentTab = TABS.find((t) => t.key === tab)!

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 pb-2 pt-1">
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          href={currentTab.href}
          className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div>
        {tab === 'orders' && (orders.length === 0 ? <Empty /> : orders.map((o) => (
          <RowLink
            key={o.id}
            href={`/orders/${o.id}`}
            title={o.order_number}
            subtitle={[o.customer?.name, o.source === 'storefront' ? 'Storefront' : null].filter(Boolean).join(' · ') || undefined}
            meta={formatDate(o.created_at)}
            trailing={<StatusBadge status={o.status} />}
          />
        )))}

        {tab === 'invoices' && (invoices.length === 0 ? <Empty /> : invoices.map((inv) => (
          <RowLink
            key={inv.id}
            href={`/invoices/${inv.id}`}
            title={inv.invoice_number}
            subtitle={inv.customer?.name ?? undefined}
            meta={formatDate(inv.issue_date)}
            trailing={
              <>
                <span className="text-xs font-semibold tabular-nums">{formatCurrency(inv.total)}</span>
                <StatusBadge status={inv.status} />
              </>
            }
          />
        )))}

        {tab === 'customers' && (customers.length === 0 ? <Empty /> : customers.map((c) => (
          <RowLink
            key={c.id}
            href={`/customers/${c.id}`}
            title={c.name}
            subtitle={c.email ?? c.org_number ?? undefined}
            meta={formatDate(c.created_at)}
          />
        )))}

        {tab === 'products' && (products.length === 0 ? <Empty /> : products.map((p) => (
          <RowLink
            key={p.id}
            href={`/products/${p.id}`}
            title={p.name}
            subtitle={`REF ${p.ref}${p.category ? ` · ${p.category.name}` : ''}`}
            trailing={
              <>
                <span className="text-xs font-semibold tabular-nums">{formatCurrency(p.unit_price)}</span>
                <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
              </>
            }
          />
        )))}
      </div>
    </div>
  )
}

function Empty() {
  return <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing to show yet.</div>
}
