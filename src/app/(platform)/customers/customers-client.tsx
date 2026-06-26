'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer } from '@/types'
import { useRole } from '@/hooks/use-role'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FilterSelect } from '@/components/ui/filter-select'
import { Pagination } from '@/components/ui/pagination'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Eye, CheckCircle, XCircle } from '@/components/icons'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createCustomer, updateCustomer, softDeleteCustomer } from './actions'
import { approveCustomer, rejectCustomer } from '@/app/(store)/shop/actions'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createArchiveAction, createExportAction, createApproveAction } from '@/lib/bulk-actions'
import type { CustomerInput } from '@/lib/validators'

const EMPTY: CustomerInput = { name: '', email: '', phone: '', address: '', tax_id: '', notes: '', org_number: '', contact_person: '', website: '', discount_group_id: null }

interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }

type DiscountGroup = {
  id: string
  name: string
  discount_rate: number
}

export function CustomersClient({
  initialCustomers,
  pendingCustomers = [],
  pagination,
  discountGroups = [],
}: {
  initialCustomers: Customer[]
  pendingCustomers?: Customer[]
  pagination: PaginationInfo
  discountGroups?: DiscountGroup[]
}) {
  const router = useRouter()
  const { canWrite, canDelete, isAdmin } = useRole()
  const [customers, setCustomers] = useState(initialCustomers)
  useEffect(() => { setCustomers(initialCustomers) }, [initialCustomers])
  const [pending, setPending] = useState(pendingCustomers)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerInput>(EMPTY)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false)

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.org_number?.toLowerCase().includes(q)
      const matchSource = sourceFilter === 'all' ||
        (sourceFilter === 'web' && !!c.auth_user_id) ||
        (sourceFilter === 'manual' && !c.auth_user_id)
      return matchSearch && matchSource
    })
  }, [customers, search, sourceFilter])

  function openCreate() { setEditing(null); setForm(EMPTY); setDialogOpen(true) }
  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ 
      name: c.name, 
      email: c.email ?? '', 
      phone: c.phone ?? '', 
      address: c.address ?? '', 
      tax_id: c.tax_id ?? '', 
      notes: c.notes ?? '',
      org_number: c.org_number ?? '',
      contact_person: c.contact_person ?? '',
      website: c.website ?? '',
      discount_group_id: (c as any).discount_group_id ?? null
    })
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setConfirmArchiveId(id)
  }

  function doDelete() {
    if (!confirmArchiveId) return
    startTransition(async () => {
      const r = await softDeleteCustomer(confirmArchiveId)
      if (r.error) { toast.error(r.error); return }
      setCustomers((prev) => prev.filter((c) => c.id !== confirmArchiveId))
      setConfirmArchiveId(null)
      toast.success('Customer archived')
    })
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const r = await approveCustomer(id)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      const approved = pending.find(c => c.id === id)
      if (approved) {
        setPending(prev => prev.filter(c => c.id !== id))
        setCustomers(prev => [...prev, { ...approved, is_approved: true }])
      }
      toast.success('Customer approved')
    })
  }

  function handleReject(id: string) {
    setConfirmRejectId(id)
  }

  function doReject() {
    if (!confirmRejectId) return
    startTransition(async () => {
      const r = await rejectCustomer(confirmRejectId)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      setPending(prev => prev.filter(c => c.id !== confirmRejectId))
      setConfirmRejectId(null)
      toast.success('Registration rejected')
    })
  }

  // Bulk actions
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

  function handleBulkArchive() {
    setConfirmBulkArchive(true)
  }

  function doBulkArchive() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const r = await softDeleteCustomer(id)
        if (r.error) errors.push(`${id}: ${r.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to archive ${errors.length} customer(s)`)
      } else {
        toast.success(`Archived ${ids.length} customer(s)`)
        setCustomers(prev => prev.filter(c => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
      }
      setConfirmBulkArchive(false)
    })
  }

  function handleBulkExport() {
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id))
    const csv = [
      ['Name', 'Email', 'Phone', 'Org Number', 'Address'].join(','),
      ...selectedCustomers.map(c => [
        c.name,
        c.email || '',
        c.phone || '',
        c.org_number || '',
        c.address || ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${selectedCustomers.length} customer(s)`)
  }

  function handleBulkApprove() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const customer = customers.find(c => c.id === id)
        if (!customer?.is_approved) {
          const r = await approveCustomer(id)
          if ('error' in r && r.error) errors.push(`${id}: ${String(r.error)}`)
        }
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to approve ${errors.length} customer(s)`)
      } else {
        toast.success(`Approved ${ids.length} customer(s)`)
        router.refresh()
        setSelectedIds(new Set())
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = editing ? await updateCustomer(editing.id, form) : await createCustomer(form)
      if (r.error) { toast.error(r.error); return }
      toast.success(editing ? 'Customer updated' : 'Customer created')
      setDialogOpen(false)
      router.refresh()
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Company',
      cell: (c: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-orange-600">{c.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{c.name}</p>
            {c.org_number && <p className="text-xs text-muted-foreground">Org: {c.org_number}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (c: Customer) => (
        <div>
          {c.email && <p className="text-sm text-foreground">{c.email}</p>}
          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      cell: (c: Customer) => (
        <span className="text-sm text-muted-foreground">{c.address ?? '—'}</span>
      ),
    },
    {
      key: 'discount_group',
      header: 'Discount',
      className: 'w-40',
      cell: (c: Customer) => {
        const group = (c as any).discount_group
        if (!group) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <span className="text-sm text-foreground">
            {group.name} <span className="text-muted-foreground">({group.discount_rate}%)</span>
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-32',
      cell: (c: Customer) => (
        <StatusBadge status={c.is_approved ? 'approved' : 'pending'} type="customer" />
      ),
    },
    ...((canWrite || canDelete) ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (c: Customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => window.location.href = `/customers/${c.id}`}>
              <Eye className="h-4 w-4" />View history
            </DropdownMenuItem>
            {canWrite && (
              <DropdownMenuItem onClick={() => openEdit(c)} className="gap-2">
                <Pencil className="h-4 w-4" />Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDelete(c.id)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />Archive
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-8">
      {/* Pending approvals */}
      {isAdmin && pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pending Approval</h2>
            <Badge variant="destructive">{pending.length}</Badge>
          </div>
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-4 border border-warning/40 bg-warning/5 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.org_number && `Org: ${c.org_number}`}
                    {c.contact_person && ` · ${c.contact_person}`}
                    {c.email && ` · ${c.email}`}
                    {c.phone && ` · ${c.phone}`}
                  </p>
                  {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                  {c.website && <p className="text-xs text-muted-foreground">{c.website}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="h-8" onClick={() => handleApprove(c.id)} disabled={isPending}>
                    <CheckCircle className="h-3.5 w-3.5" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(c.id)} disabled={isPending}>
                    <XCircle className="h-3.5 w-3.5" />Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect className="w-44" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All customers</option>
            <option value="web">Web registration</option>
            <option value="manual">Manually added</option>
          </FilterSelect>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />New Customer
          </Button>
        )}
      </div>

      {canWrite && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            createExportAction(handleBulkExport),
            ...(isAdmin ? [createApproveAction(handleBulkApprove)] : []),
            ...(canDelete ? [createArchiveAction(handleBulkArchive)] : []),
          ]}
        />
      )}

      <DataTable 
        columns={columns} 
        data={filtered} 
        emptyMessage="No customers yet." 
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        selectable={canWrite || canDelete || isAdmin}
        selectedIds={selectedIds}
        onSelectAll={(canWrite || canDelete || isAdmin) ? handleSelectAll : undefined}
        onSelectRow={(canWrite || canDelete || isAdmin) ? handleSelectRow : undefined}
      />
      <Pagination {...pagination} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-4">
              {/* Company Information */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Company Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={isPending} />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Number</Label>
                    <Input value={form.org_number ?? ''} onChange={(e) => setForm({ ...form, org_number: e.target.value })} disabled={isPending} placeholder="556789-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID / VAT</Label>
                    <Input value={form.tax_id ?? ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} disabled={isPending} placeholder="SE556789123401" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Address</Label>
                    <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={isPending} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Website</Label>
                    <Input value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} disabled={isPending} placeholder="www.example.com" />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Person</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Full Name</Label>
                    <Input value={form.contact_person ?? ''} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} disabled={isPending} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={isPending} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={isPending} />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={isPending} rows={2} placeholder="Internal notes (not visible to customer)" />
              </div>

              {/* Discount Group */}
              <div className="space-y-2">
                <Label>Discount Group</Label>
                <FilterSelect 
                  value={form.discount_group_id ?? ''} 
                  onChange={(e) => setForm({ ...form, discount_group_id: e.target.value || null })}
                  disabled={isPending}
                >
                  <option value="">No discount</option>
                  {discountGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.discount_rate}%)
                    </option>
                  ))}
                </FilterSelect>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>

      <ConfirmDialog
        open={confirmArchiveId !== null}
        onOpenChange={(o) => { if (!o) setConfirmArchiveId(null) }}
        title="Archive customer?"
        description="This customer will be hidden from the system. Their order history is preserved."
        confirmLabel="Archive"
        onConfirm={doDelete}
      />

      <ConfirmDialog
        open={confirmRejectId !== null}
        onOpenChange={(o) => { if (!o) setConfirmRejectId(null) }}
        title="Reject registration?"
        description="This will permanently delete the customer's registration and block them from ordering."
        confirmLabel="Reject & Delete"
        onConfirm={doReject}
      />

      <ConfirmDialog
        open={confirmBulkArchive}
        onOpenChange={setConfirmBulkArchive}
        title={`Archive ${selectedIds.size} customer(s)?`}
        description="These customers will be hidden from the system. Their order history will be preserved."
        confirmLabel="Archive All"
        onConfirm={doBulkArchive}
      />
    </div>
  )
}
