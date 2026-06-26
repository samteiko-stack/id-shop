'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'
import { useRole } from '@/hooks/use-role'
import { DataTable } from '@/components/tables/data-table'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/ui/filter-select'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search } from '@/components/icons'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createExportAction } from '@/lib/bulk-actions'
import { toast } from '@/lib/toast'

const columns = [
  {
    key: 'number',
    header: 'Credit Note',
    cell: (c: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-rose-600">CR</span>
        </div>
        <Link href={`/credit-invoices/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
          {c.credit_number}
        </Link>
      </div>
    ),
  },
  {
    key: 'invoice',
    header: 'Original Invoice',
    cell: (c: any) => <span className="text-sm text-muted-foreground">{c.invoice?.invoice_number ?? '—'}</span>,
  },
  {
    key: 'customer',
    header: 'Customer',
    cell: (c: any) => <span className="text-sm">{c.customer?.name ?? '—'}</span>,
  },
  {
    key: 'total',
    header: 'Amount',
    cell: (c: any) => (
      <span className="text-sm font-semibold text-destructive">
        −{formatCurrency(c.total)}
      </span>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    cell: (c: any) => <span className="text-sm text-muted-foreground">{formatDate(c.created_at)}</span>,
  },
]

interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }

export function CreditInvoicesClient({ credits, pagination }: { credits: any[]; pagination: PaginationInfo }) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const uniqueCustomers = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of credits) {
      if (c.customer_id && c.customer?.name && !seen.has(c.customer_id)) {
        seen.set(c.customer_id, c.customer.name)
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [credits])

  const filtered = useMemo(() => {
    return credits.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        c.credit_number?.toLowerCase().includes(q) ||
        c.customer?.name?.toLowerCase().includes(q) ||
        c.invoice?.invoice_number?.toLowerCase().includes(q)
      const matchCustomer = customerFilter === 'all' || c.customer_id === customerFilter
      return matchSearch && matchCustomer
    })
  }, [credits, search, customerFilter])

  // Bulk actions handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(c => c.id)))
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
    const selectedCredits = credits.filter(c => selectedIds.has(c.id))
    const csv = [
      ['Credit Number', 'Invoice', 'Customer', 'Amount', 'Date'].join(','),
      ...selectedCredits.map(c => [
        c.credit_number,
        c.invoice?.invoice_number || '',
        c.customer?.name || '',
        c.total?.toString() || '0',
        new Date(c.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${selectedCredits.length} credit note(s)`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search credit notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <FilterSelect className="w-44" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
          <option value="all">All customers</option>
          {uniqueCustomers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FilterSelect>
        </div>
        {canWrite && (
          <Link href="/credit-invoices/new">
            <Button className="gap-2"><Plus className="h-4 w-4" />New Credit Note</Button>
          </Link>
        )}
      </div>
      
      {canWrite && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            createExportAction(handleBulkExport),
          ]}
        />
      )}
      
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No credit invoices found."
        onRowClick={(c) => router.push(`/credit-invoices/${c.id}`)}
        selectable={canWrite}
        selectedIds={selectedIds}
        onSelectAll={canWrite ? handleSelectAll : undefined}
        onSelectRow={canWrite ? handleSelectRow : undefined}
      />
      <Pagination {...pagination} />
    </div>
  )
}
