'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Customer } from '@/types'
import { DataTable } from '@/components/tables/data-table'
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
import { cn } from '@/lib/utils'
import { Search, RotateCcw, Trash2, MoreHorizontal } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { restoreArchivedItems } from './actions'
import { permanentDeleteOrder } from '@/app/(platform)/orders/actions'
import type {
  ArchivePagination,
  ArchiveType,
  ArchivedGenericRow,
  ArchivedRow,
  ArchivedSalesRow,
} from './types'

interface Props {
  type: ArchiveType
  types: ReadonlyArray<{ id: ArchiveType; label: string }>
  rows: ArchivedRow[]
  customers: Customer[]
  pagination: ArchivePagination
}

export function ArchiveClient({ type, types, rows, customers, pagination }: Props) {
  const router = useRouter()
  const { canWrite, canDelete, isAdmin } = useRole()
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

  const canRestore = type === 'sales' ? canWrite : canDelete

  const salesRows = rows.filter((row): row is ArchivedSalesRow => row.kind === 'sales')
  const genericRows = rows.filter((row): row is ArchivedGenericRow => row.kind !== 'sales')

  const filteredSales = useMemo(() => {
    return salesRows.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchCustomer = customerFilter === 'all' || o.customer_id === customerFilter
      const matchSource = sourceFilter === 'all' || o.source === sourceFilter
      return matchSearch && matchStatus && matchCustomer && matchSource
    })
  }, [salesRows, search, statusFilter, customerFilter, sourceFilter, customers])

  const filteredGeneric = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return genericRows
    return genericRows.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.subtitle?.toLowerCase().includes(q),
    )
  }, [genericRows, search])


  function handleSelectAll(checked: boolean) {
    const items = type === 'sales' ? filteredSales : filteredGeneric
    setSelectedIds(checked ? new Set(items.map((row) => row.id)) : new Set())
  }

  function handleSelectRow(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  function runRestore(ids: string[]) {
    startTransition(async () => {
      const result = await restoreArchivedItems(type, ids)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Restored ${ids.length} item(s)`)
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

  const salesColumns = [
    {
      key: 'archived_at',
      header: 'Archived',
      cell: (o: ArchivedSalesRow) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(o.deleted_at)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Sale date',
      cell: (o: ArchivedSalesRow) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(o.created_at)}</span>
      ),
    },
    {
      key: 'order_number',
      header: 'Reference No',
      cell: (o: ArchivedSalesRow) => (
        <span className="text-sm font-semibold text-foreground">{o.order_number}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o: ArchivedSalesRow) => (
        <span className="text-sm text-foreground">{o.customer_name ?? '—'}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (o: ArchivedSalesRow) => (
        <StatusBadge status={o.source === 'storefront' ? 'storefront' : 'internal'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (o: ArchivedSalesRow) => <StatusBadge status={o.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (o: ArchivedSalesRow) => (
        <span className="text-sm font-semibold">{o.order_total.toFixed(2)} SEK</span>
      ),
    },
    ...(canRestore
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            stopPropagation: true,
            cell: (o: ArchivedSalesRow) => (
              <RowActions
                label={o.order_number}
                canRestore={canRestore}
                canDeleteForever={isAdmin}
                onRestore={() =>
                  setConfirm({
                    title: 'Restore this sale?',
                    description: `${o.order_number} will return to the active sales list.`,
                    confirmLabel: 'Restore',
                    variant: 'default',
                    action: () => runRestore([o.id]),
                  })
                }
                onDeleteForever={() =>
                  setConfirm({
                    title: 'Delete forever?',
                    description: `${o.order_number} will be permanently removed. Sales with LOT records or paid invoices cannot be deleted.`,
                    confirmLabel: 'Delete forever',
                    variant: 'destructive',
                    action: () => runPermanentDelete([o.id]),
                  })
                }
              />
            ),
          },
        ]
      : []),
  ]

  const genericColumns = [
    {
      key: 'archived_at',
      header: 'Archived',
      cell: (row: ArchivedGenericRow) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.deleted_at)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Name',
      cell: (row: ArchivedGenericRow) => (
        <span className="text-sm font-semibold text-foreground">{row.title}</span>
      ),
    },
    {
      key: 'subtitle',
      header: 'Details',
      cell: (row: ArchivedGenericRow) => (
        <span className="text-sm text-muted-foreground">{row.subtitle ?? '—'}</span>
      ),
    },
    ...(canRestore
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            stopPropagation: true,
            cell: (row: ArchivedGenericRow) => (
              <RowActions
                label={row.title}
                canRestore={canRestore}
                onRestore={() =>
                  setConfirm({
                    title: 'Restore this item?',
                    description: `${row.title} will return to the active list.`,
                    confirmLabel: 'Restore',
                    variant: 'default',
                    action: () => runRestore([row.id]),
                  })
                }
              />
            ),
          },
        ]
      : []),
  ]

  const typeLabel = types.find((t) => t.id === type)?.label ?? 'Archive'

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Restore archived sales, catalog items, customers, and content.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {types.map((tab) => (
          <Link
            key={tab.id}
            href={`/archive?type=${tab.id}`}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              tab.id === type
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search archived ${typeLabel.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {type === 'sales' && (
            <>
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
            </>
          )}
        </div>

        {canRestore && selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            actions={[
              {
                label: 'Restore',
                icon: RotateCcw,
                onClick: () =>
                  setConfirm({
                    title: `Restore ${selectedIds.size} item(s)?`,
                    description: 'Selected items will return to their active lists.',
                    confirmLabel: 'Restore',
                    variant: 'default',
                    action: () => runRestore(Array.from(selectedIds)),
                  }),
                variant: 'default',
                disabled: isPending,
              },
              ...(type === 'sales' && isAdmin
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

        {type === 'sales' ? (
          <DataTable
            columns={salesColumns}
            data={filteredSales}
            emptyMessage={`No archived ${typeLabel.toLowerCase()}.`}
            selectable={canRestore}
            selectedIds={selectedIds}
            onSelectAll={canRestore ? handleSelectAll : undefined}
            onSelectRow={canRestore ? handleSelectRow : undefined}
          />
        ) : (
          <DataTable
            columns={genericColumns}
            data={filteredGeneric}
            emptyMessage={`No archived ${typeLabel.toLowerCase()}.`}
            selectable={canRestore}
            selectedIds={selectedIds}
            onSelectAll={canRestore ? handleSelectAll : undefined}
            onSelectRow={canRestore ? handleSelectRow : undefined}
          />
        )}

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

function RowActions({
  label,
  canRestore,
  canDeleteForever = false,
  onRestore,
  onDeleteForever,
}: {
  label: string
  canRestore: boolean
  canDeleteForever?: boolean
  onRestore: () => void
  onDeleteForever?: () => void
}) {
  if (!canRestore) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2" onClick={onRestore}>
          <RotateCcw className="h-4 w-4" />
          Restore
        </DropdownMenuItem>
        {canDeleteForever && onDeleteForever && (
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDeleteForever}>
            <Trash2 className="h-4 w-4" />
            Delete forever
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
