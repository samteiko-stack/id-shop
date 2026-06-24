'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Order, Customer, OrderStatus } from '@/types'
import { DataTable } from '@/components/tables/data-table'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/ui/filter-select'
import { Pagination } from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime, cn } from '@/lib/utils'
import { Plus, Search, FileText, MoreHorizontal, Eye, Copy } from '@/components/icons'
import Link from 'next/link'
import { useRole } from '@/hooks/use-role'
import { StatusBadge } from '@/components/ui/status-badge'
import { duplicateOrder, createInvoiceFromOrder, markOrderAsSeen } from './actions'
import { toast } from 'sonner'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createExportAction, createDuplicateAction } from '@/lib/bulk-actions'
import { Badge } from '@/components/ui/badge'
interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }

interface Props {
  initialOrders: Order[]
  customers: Customer[]
  pagination: PaginationInfo
  unreadOrderIds?: string[]
}

export function OrdersClient({ initialOrders, customers, pagination, unreadOrderIds = [] }: Props) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [isPending, startTransition] = useTransition()
  const [dismissedUnread, setDismissedUnread] = useState<Set<string>>(new Set())

  const unreadSet = useMemo(() => {
    const set = new Set(unreadOrderIds)
    for (const id of dismissedUnread) set.delete(id)
    return set
  }, [unreadOrderIds, dismissedUnread])

  const isUnread = (orderId: string) => unreadSet.has(orderId)
  const unreadCount = unreadSet.size

  function handleRowClick(o: Order) {
    if (isUnread(o.id)) {
      setDismissedUnread((prev) => new Set(prev).add(o.id))
      void markOrderAsSeen(o.id)
    }
    router.push(`/orders/${o.id}`)
  }
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [inboxFilter, setInboxFilter] = useState<string>('all')
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function handleDuplicate(orderId: string, e: React.MouseEvent) {
    e.stopPropagation()
    duplicateOrder(orderId).then((res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success(`Order duplicated: ${res.data?.orderNumber}`)
      router.push(`/orders/${res.data?.orderId}`)
    })
  }

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        o.order_number.toLowerCase().includes(q) ||
        (o.customer as any)?.name?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchCustomer = customerFilter === 'all' || o.customer_id === customerFilter
      const matchSource = sourceFilter === 'all' || o.source === sourceFilter
      const matchInbox = inboxFilter === 'all' || (inboxFilter === 'unread' && isUnread(o.id))
      return matchSearch && matchStatus && matchCustomer && matchSource && matchInbox
    })
  }, [initialOrders, search, statusFilter, customerFilter, sourceFilter, inboxFilter, unreadSet])

  // Bulk actions handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(o => o.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  function handleBulkExport() {
    const selectedOrders = initialOrders.filter(o => selectedIds.has(o.id))
    const csv = [
      ['Order Number', 'Customer', 'Source', 'Status', 'Total', 'Date'].join(','),
      ...selectedOrders.map(o => [
        o.order_number,
        (o.customer as any)?.name || '',
        o.source === 'storefront' ? 'Storefront' : 'Manual',
        o.status,
        ((o as any).total ?? 0).toString(),
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${selectedOrders.length} order(s)`)
  }

  function handleBulkDuplicate() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const r = await duplicateOrder(id)
        if (r.error) errors.push(`${id}: ${r.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to duplicate ${errors.length} order(s)`)
      } else {
        toast.success(`Duplicated ${ids.length} order(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
    })
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      cell: (o: Order) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(o.created_at)}</span>
      ),
    },
    {
      key: 'order_number',
      header: 'Reference No',
      cell: (o: Order) => (
        <Link
          href={`/orders/${o.id}`}
          onClick={(e) => {
            if (isUnread(o.id)) {
              setDismissedUnread((prev) => new Set(prev).add(o.id))
              void markOrderAsSeen(o.id)
            }
          }}
          className={cn(
            'text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-2',
            isUnread(o.id) ? 'font-bold' : 'font-semibold',
          )}
        >
          {isUnread(o.id) && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="New — not yet opened" />
          )}
          {o.order_number}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o: Order) => (
        <span className={cn('text-sm text-foreground', isUnread(o.id) && 'font-semibold')}>
          {(o.customer as any)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      className: 'w-32',
      cell: (o: Order) => (
        <StatusBadge status={o.source === 'storefront' ? 'storefront' : 'internal'} />
      ),
    },
    {
      key: 'status',
      header: 'Sale Status',
      cell: (o: Order) => <StatusBadge status={o.status} />,
    },
    {
      key: 'invoice',
      header: 'Invoice',
      cell: (o: Order) => {
        const order = o as any
        if (!order.invoice_number) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <Link
            href={`/invoices/${order.invoice_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-primary hover:underline"
          >
            {order.invoice_number}
          </Link>
        )
      },
    },
    {
      key: 'total',
      header: 'Grand Total',
      cell: (o: Order) => {
        const total = (o as any).order_total ?? 0
        return <span className="text-sm font-semibold text-foreground">{total.toFixed(2)} SEK</span>
      },
    },
    {
      key: 'paid',
      header: 'Paid',
      cell: (o: Order) => {
        const order = o as any
        if (order.payment_status === 'not_invoiced') {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        const paid = order.paid_amount || 0
        return <span className="text-sm text-emerald-600 font-medium">{paid.toFixed(2)}</span>
      },
    },
    {
      key: 'balance',
      header: 'Balance',
      cell: (o: Order) => {
        const order = o as any
        if (order.payment_status === 'not_invoiced') {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        const balance = order.balance || 0
        return <span className="text-sm text-amber-600 font-medium">{balance.toFixed(2)}</span>
      },
    },
    {
      key: 'payment_status',
      header: 'Payment Status',
      cell: (o: Order) => {
        const paymentStatus = (o as any).payment_status || 'not_invoiced'
        return <StatusBadge status={paymentStatus} type="payment" />
      },
    },
    ...(canWrite ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (o: Order) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/orders/${o.id}`)} className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleDuplicate(o.id, e)} className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {o.status === 'fulfilled' && (
              (o as any).invoice_id ? (
                <DropdownMenuItem onClick={() => router.push(`/invoices/${(o as any).invoice_id}`)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Invoice
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    startTransition(async () => {
                      const result = await createInvoiceFromOrder(o.id)
                      if (result.error) { toast.error(result.error); return }
                      toast.success(`Invoice ${result.data?.invoiceNumber} created`)
                      router.refresh()
                    })
                  }}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Create Invoice
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sales…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect className="w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
          <FilterSelect className="w-44" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="all">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect className="w-36" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All sources</option>
            <option value="storefront">Storefront</option>
            <option value="internal">Manual</option>
          </FilterSelect>
          <FilterSelect className="w-36" value={inboxFilter} onChange={(e) => setInboxFilter(e.target.value)}>
            <option value="all">All sales</option>
            <option value="unread">Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}</option>
          </FilterSelect>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {canWrite && (
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />New Sale
            </Button>
          </Link>
        )}
      </div>
      
      {canWrite && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            createExportAction(handleBulkExport),
            createDuplicateAction(handleBulkDuplicate, isPending),
          ]}
        />
      )}
      
      <DataTable 
        columns={columns} 
        data={filtered} 
        emptyMessage="No sales found." 
        onRowClick={handleRowClick}
        rowClassName={(o) =>
          isUnread(o.id) ? 'bg-primary/[0.04] border-l-[3px] border-l-primary' : undefined
        }
        selectable={canWrite}
        selectedIds={selectedIds}
        onSelectAll={canWrite ? handleSelectAll : undefined}
        onSelectRow={canWrite ? handleSelectRow : undefined}
      />
      <Pagination {...pagination} />

    </div>
  )
}
