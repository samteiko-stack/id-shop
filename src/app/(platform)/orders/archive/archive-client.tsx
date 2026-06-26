'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer, Order } from '@/types'
import { DataTable } from '@/components/tables/data-table'
import { ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/ui/filter-select'
import { Pagination } from '@/components/ui/pagination'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageContainer } from '@/components/layout/page-container'
import { createDeleteAction } from '@/lib/bulk-actions'
import { formatDateTime } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { toast } from '@/lib/toast'
import { Search, RotateCcw, Trash2, ArrowLeft, MoreHorizontal } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { permanentDeleteOrder, restoreOrder } from '../actions'

interface PaginationInfo {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}

type ArchivedOrder = Order & {
  deleted_at: string
  order_total?: number
}

interface Props {
  initialOrders: ArchivedOrder[]
  customers: Customer[]
  pagination: PaginationInfo
}

export function ArchiveOrdersClient({ initialOrders, customers, pagination }: Props) {
  const router = useRouter()
  const { canWrite, isAdmin } = useRole()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: 'default' | 'destructive'
    action: () => void
  } | null>(null)

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        o.order_number.toLowerCase().includes(q) ||
        (o.customer as any)?.name?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchCustomer = customerFilter === 'all' || o.customer_id === customerFilter
      const matchSource = sourceFilter === 'all' || o.source === sourceFilter
      return matchSearch && matchStatus && matchCustomer && matchSource
    })
  }, [initialOrders, search, statusFilter, customerFilter, sourceFilter])

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(filtered.map((o) => o.id)) : new Set())
  }

  function handleSelectRow(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  function runRestore(ids: string[]) {
    startTransition(async () => {
      const errors: string[] = []
      for (const id of ids) {
        const result = await restoreOrder(id)
        if (result.error) errors.push(result.error)
      }
      if (errors.length > 0) {
        toast.error(errors[0] ?? 'Failed to restore sales')
      } else {
        toast.success(`Restored ${ids.length} sale(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirm(null)
    })
  }

  function runPermanentDelete(ids: string[]) {
    startTransition(async () => {
      const errors: string[] = []
      for (const id of ids) {
        const result = await permanentDeleteOrder(id)
        if (result.error) errors.push(result.error)
      }
      if (errors.length > 0) {
        toast.error(errors[0] ?? 'Failed to delete sales')
      } else {
        toast.success(`Permanently deleted ${ids.length} sale(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirm(null)
    })
  }

  const columns = [
    {
      key: 'archived_at',
      header: 'Archived',
      cell: (o: ArchivedOrder) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(o.deleted_at)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Sale date',
      cell: (o: ArchivedOrder) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(o.created_at)}</span>
      ),
    },
    {
      key: 'order_number',
      header: 'Reference No',
      cell: (o: ArchivedOrder) => (
        <span className="text-sm font-semibold text-foreground">{o.order_number}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o: ArchivedOrder) => (
        <span className="text-sm text-foreground">{(o.customer as any)?.name ?? '—'}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (o: ArchivedOrder) => (
        <StatusBadge status={o.source === 'storefront' ? 'storefront' : 'internal'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (o: ArchivedOrder) => <StatusBadge status={o.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (o: ArchivedOrder) => (
        <span className="text-sm font-semibold">{(o.order_total ?? 0).toFixed(2)} SEK</span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            stopPropagation: true,
            cell: (o: ArchivedOrder) => (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() =>
                      setConfirm({
                        title: 'Restore this sale?',
                        description: `${o.order_number} will return to the active sales list.`,
                        confirmLabel: 'Restore',
                        variant: 'default',
                        action: () => runRestore([o.id]),
                      })
                    }
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={() =>
                        setConfirm({
                          title: 'Delete forever?',
                          description: `${o.order_number} will be permanently removed. Sales with LOT records or paid invoices cannot be deleted.`,
                          confirmLabel: 'Delete forever',
                          variant: 'destructive',
                          action: () => runPermanentDelete([o.id]),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete forever
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ]

  return (
    <PageContainer>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archived Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restore sales or permanently delete them (admin only).
          </p>
        </div>
        <ButtonLink href="/orders" variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Sales
        </ButtonLink>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archived sales…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect className="w-36" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All sources</option>
            <option value="storefront">Storefront</option>
            <option value="internal">Manual</option>
          </FilterSelect>
        </div>

        {canWrite && selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            actions={[
              {
                label: 'Restore',
                icon: RotateCcw,
                onClick: () =>
                  setConfirm({
                    title: `Restore ${selectedIds.size} sale(s)?`,
                    description: 'Selected sales will return to the active sales list.',
                    confirmLabel: 'Restore',
                    variant: 'default',
                    action: () => runRestore(Array.from(selectedIds)),
                  }),
                variant: 'default',
                disabled: isPending,
              },
              ...(isAdmin
                ? [
                    createDeleteAction(
                      () =>
                        setConfirm({
                          title: `Delete ${selectedIds.size} sale(s) forever?`,
                          description:
                            'This cannot be undone. Sales with LOT records or paid invoices will fail.',
                          confirmLabel: 'Delete forever',
                          variant: 'destructive',
                          action: () => runPermanentDelete(Array.from(selectedIds)),
                        }),
                      isPending,
                    ),
                  ]
                : []),
            ]}
          />
        )}

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No archived sales."
          selectable={canWrite}
          selectedIds={selectedIds}
          onSelectAll={canWrite ? handleSelectAll : undefined}
          onSelectRow={canWrite ? handleSelectRow : undefined}
        />

        <Pagination {...pagination} />
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        variant={confirm?.variant ?? 'default'}
        onConfirm={() => confirm?.action()}
        loading={isPending}
      />
    </PageContainer>
  )
}
