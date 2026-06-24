'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice, Customer, Order } from '@/types'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FilterSelect } from '@/components/ui/filter-select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Combobox } from '@/components/ui/combobox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Search, FileText, Send, Loader2, Trash2, MoreHorizontal, Eye, Download, FileMinus } from '@/components/icons'
import { ConfirmDialog, type ConfirmVariant } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { useRole } from '@/hooks/use-role'
import { createInvoice, sendInvoiceEmail, loadInvoiceCreateOptions } from './actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createExportAction, createEmailAction } from '@/lib/bulk-actions'

interface LineItem { product_id: string | null; description: string; quantity: number; unit_price: number }
interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }

interface Props {
  initialInvoices: Invoice[]
  customers: Customer[]
  fromOrder?: any
  defaultTaxRate?: number
  pagination: PaginationInfo
}

export function InvoicesClient({ initialInvoices, customers, fromOrder, defaultTaxRate = 0, pagination }: Props) {
  const router = useRouter()
  const { canWrite, canCreateInvoice, canCancelInvoice } = useRole()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [creditedFilter, setCreditedFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: ConfirmVariant
    onConfirm: () => void
  } | null>(null)
  const [formCustomers, setFormCustomers] = useState<Customer[]>([])
  const [formOrders, setFormOrders] = useState<Pick<Order, 'id' | 'order_number'>[]>([])
  const [formOptionsLoading, setFormOptionsLoading] = useState(false)

  // Form state
  const [customerId, setCustomerId] = useState(fromOrder?.customer_id ?? '')
  const [orderId, setOrderId] = useState(fromOrder?.id ?? '')
  const [taxRate, setTaxRate] = useState(defaultTaxRate)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>(
    fromOrder?.items?.map((i: any) => ({
      product_id: i.product_id,
      description: i.product?.name ?? '',
      quantity: i.quantity,
      unit_price: i.unit_price,
    })) ?? [{ product_id: null, description: '', quantity: 1, unit_price: 0 }]
  )

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (canCreateInvoice && fromOrder) setDialogOpen(true)
  }, [canCreateInvoice, fromOrder])

  useEffect(() => {
    if (!dialogOpen || !canCreateInvoice || formCustomers.length > 0) return

    let cancelled = false
    setFormOptionsLoading(true)
    void loadInvoiceCreateOptions().then((result) => {
      if (cancelled) return
      if ('error' in result && result.error) {
        toast.error(result.error)
        setFormOptionsLoading(false)
        return
      }
      setFormCustomers((result.customers ?? []) as Customer[])
      setFormOrders((result.orders ?? []) as Pick<Order, 'id' | 'order_number'>[])
      if (typeof result.defaultTaxRate === 'number') setTaxRate(result.defaultTaxRate)
      setFormOptionsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [dialogOpen, canCreateInvoice, formCustomers.length])

  const filtered = useMemo(() => {
    return initialInvoices.filter((i) => {
      const inv = i as any
      const q = search.toLowerCase()
      const matchSearch = !search ||
        i.invoice_number?.toLowerCase().includes(q) ||
        (i.customer as any)?.name?.toLowerCase().includes(q) ||
        (inv.credits ?? []).some((c: { credit_number?: string }) => c.credit_number?.toLowerCase().includes(q))
      const paymentStatus = i.status === 'cancelled' ? 'cancelled' : (inv.payment_status ?? 'unpaid')
      const matchStatus = statusFilter === 'all' || paymentStatus === statusFilter
      const matchCredited = creditedFilter === 'all'
        || (creditedFilter === 'yes' && (inv.credit_count ?? 0) > 0)
        || (creditedFilter === 'no' && (inv.credit_count ?? 0) === 0)
      const matchCustomer = customerFilter === 'all' || i.customer_id === customerFilter
      return matchSearch && matchStatus && matchCredited && matchCustomer
    })
  }, [initialInvoices, search, statusFilter, creditedFilter, customerFilter])

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = Math.round(subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  function addItem() { setItems([...items, { product_id: null, description: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(index: number, field: keyof LineItem, value: any) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  function handleSendEmail(invoiceId: string, invoiceNumber: string) {
    setPendingConfirm({
      title: 'Email invoice to customer?',
      description: `Invoice ${invoiceNumber} will be emailed to the customer.`,
      confirmLabel: 'Send Email',
      variant: 'warning',
      onConfirm: () => {
        startTransition(async () => {
          const r = await sendInvoiceEmail(invoiceId)
          if (r.error) { toast.error(r.error); return }
          toast.success('Invoice emailed')
          router.refresh()
        })
      },
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await createInvoice({
        order_id: orderId || null,
        customer_id: customerId,
        tax_rate: taxRate,
        currency: 'EUR',
        issue_date: issueDate,
        due_date: dueDate || null,
        notes: notes || null,
        items: items.filter((i) => i.description && i.quantity > 0),
      })
      if (r.error) { toast.error(r.error); return }
      toast.success(`Invoice ${r.data?.invoiceNumber} created`)
      setDialogOpen(false)
      router.push(`/invoices/${r.data?.invoiceId}`)
    })
  }

  // Bulk actions handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(i => i.id)))
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
    const selectedInvoices = initialInvoices.filter(i => selectedIds.has(i.id))
    const csv = [
      ['Invoice Number', 'Customer', 'Status', 'Total', 'Date'].join(','),
      ...selectedInvoices.map(i => [
        i.invoice_number,
        (i.customer as any)?.name || '',
        i.status,
        i.total?.toString() || '0',
        i.issue_date || ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${selectedInvoices.length} invoice(s)`)
  }

  function handleBulkSendEmail() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const r = await sendInvoiceEmail(id)
        if (r.error) errors.push(`${id}: ${r.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to send ${errors.length} invoice(s)`)
      } else {
        toast.success(`Sent ${ids.length} invoice(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
    })
  }

  const columns = [
    {
      key: 'number',
      header: 'Invoice',
      cell: (inv: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-emerald-600">€</span>
          </div>
          <Link href={`/invoices/${inv.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
            {inv.invoice_number}
          </Link>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (inv: Invoice) => <span className="text-sm text-foreground">{(inv.customer as any)?.name ?? '—'}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (inv: Invoice) => {
        const invWithPayment = inv as any
        return (
          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.total, inv.currency)}</span>
            {invWithPayment.payment_status && invWithPayment.payment_status !== 'unpaid' && (
              <div className="text-xs text-muted-foreground">
                Paid: {formatCurrency(invWithPayment.paid_amount ?? 0, inv.currency)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'payment',
      header: 'Status',
      cell: (inv: Invoice) => {
        const invWithPayment = inv as any
        const status = inv.status === 'cancelled' ? 'cancelled' : (invWithPayment.payment_status ?? 'unpaid')
        return <StatusBadge status={status} type={inv.status === 'cancelled' ? 'invoice' : 'payment'} />
      },
    },
    {
      key: 'credits',
      header: 'Credits',
      cell: (inv: Invoice) => {
        const invWithCredits = inv as any
        const creditCount = invWithCredits.credit_count ?? 0
        if (creditCount === 0) return <span className="text-sm text-muted-foreground">—</span>
        const credits = invWithCredits.credits ?? []
        const first = credits[0]
        return (
          <div className="space-y-1">
            {first && (
              <Link
                href={`/credit-invoices/${first.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
              >
                <FileMinus className="h-3.5 w-3.5" />
                {first.credit_number}
              </Link>
            )}
            {creditCount > 1 && (
              <span className="text-xs text-muted-foreground">
                +{creditCount - 1} more · −{formatCurrency(invWithCredits.credit_total ?? 0, inv.currency)}
              </span>
            )}
            {creditCount === 1 && (
              <span className="text-xs text-muted-foreground">
                −{formatCurrency(invWithCredits.credit_total ?? 0, inv.currency)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'date',
      header: 'Date',
      cell: (inv: Invoice) => <span className="text-sm text-muted-foreground">{inv.issue_date ? formatDate(inv.issue_date) : '—'}</span>,
    },
    ...(canWrite ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (inv: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}`)} className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, '_blank')} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            {inv.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => handleSendEmail(inv.id, inv.invoice_number)} className="gap-2">
                <Send className="h-4 w-4" />
                Email
              </DropdownMenuItem>
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
            <Input placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially paid</option>
            <option value="paid">Paid</option>
            <option value="credited">Credited</option>
            <option value="refund_due">Refund due</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
          <FilterSelect className="w-36" value={creditedFilter} onChange={(e) => setCreditedFilter(e.target.value)}>
            <option value="all">All credits</option>
            <option value="yes">Credited</option>
            <option value="no">Not credited</option>
          </FilterSelect>
          <FilterSelect className="w-44" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="all">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FilterSelect>
        </div>
        {canCreateInvoice && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />New Invoice
          </Button>
        )}
      </div>
      
      {canWrite && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            createExportAction(handleBulkExport),
            ...(typeof sendInvoiceEmail === 'function' ? [createEmailAction(handleBulkSendEmail, isPending)] : []),
          ]}
        />
      )}
      
      <DataTable 
        columns={columns} 
        data={filtered} 
        emptyMessage="No invoices yet." 
        onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
        selectable={canWrite}
        selectedIds={selectedIds}
        onSelectAll={canWrite ? handleSelectAll : undefined}
        onSelectRow={canWrite ? handleSelectRow : undefined}
      />
      <Pagination {...pagination} />

      <Dialog open={dialogOpen && canCreateInvoice} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />New Invoice
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Combobox
                  options={formCustomers.map((c) => ({ value: c.id, label: c.name }))}
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder={formOptionsLoading ? 'Loading customers…' : 'Select customer'}
                  searchPlaceholder="Search customers…"
                  disabled={isPending || formOptionsLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>From Order (optional)</Label>
                <Combobox
                  options={[{ value: 'none', label: 'None' }, ...formOrders.map((o) => ({ value: o.id, label: o.order_number }))]}
                  value={orderId || 'none'}
                  onValueChange={(v) => setOrderId(v === 'none' ? '' : v)}
                  placeholder={formOptionsLoading ? 'Loading orders…' : 'Select order'}
                  searchPlaceholder="Search orders…"
                  disabled={isPending || formOptionsLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} disabled={isPending} />
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={isPending} className="text-xs">
                  <Plus className="h-3.5 w-3.5" />Add line
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} disabled={isPending} className="text-sm" />
                    </div>
                    <div className="w-16"><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} disabled={isPending} /></div>
                    <div className="w-24"><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} disabled={isPending} /></div>
                    <div className="w-24 text-sm font-medium text-foreground h-10 flex items-center">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1 || isPending} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-6 text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Subtotal: <strong className="text-foreground">{formatCurrency(subtotal)}</strong></span>
                <span className="text-muted-foreground">VAT: <strong className="text-foreground">{formatCurrency(taxAmount)}</strong></span>
                <span className="text-foreground font-bold text-base">Total: {formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={isPending} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending || !customerId}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {pendingConfirm && (
        <ConfirmDialog
          open
          onOpenChange={(o) => { if (!o) setPendingConfirm(null) }}
          title={pendingConfirm.title}
          description={pendingConfirm.description}
          confirmLabel={pendingConfirm.confirmLabel}
          variant={pendingConfirm.variant}
          onConfirm={pendingConfirm.onConfirm}
        />
      )}
    </div>
  )
}
