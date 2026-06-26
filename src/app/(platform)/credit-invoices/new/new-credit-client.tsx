'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { ArrowLeft, Plus, Trash2, Loader2, FileMinus } from '@/components/icons'
import Link from 'next/link'
import { createCreditInvoice } from './actions'

interface LineItem { invoice_item_id: string | null; description: string; quantity: number; unit_price: number }

export function NewCreditInvoiceClient({
  invoices,
  selectedInvoice: initialInvoice,
}: {
  invoices: any[]
  selectedInvoice?: any
}) {
  const router = useRouter()
  const [selectedInvoice, setSelectedInvoice] = useState<any>(initialInvoice)
  const [reason, setReason] = useState('')
  const [items, setItems] = useState<LineItem[]>(
    initialInvoice?.items?.map((i: any) => ({
      invoice_item_id: i.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })) ?? [{ invoice_item_id: null, description: '', quantity: 1, unit_price: 0 }]
  )
  const [isPending, startTransition] = useTransition()

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  function handleSelectInvoice(invoiceId: string | null) {
    if (!invoiceId) return
    const inv = invoices.find((i) => i.id === invoiceId)
    setSelectedInvoice(inv)
    if (inv?.items) {
      setItems(inv.items.map((i: any) => ({
        invoice_item_id: i.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedInvoice) { toast.error('Select an invoice to credit'); return }
    if (!reason.trim()) { toast.error('Reason is required'); return }

    startTransition(async () => {
      const r = await createCreditInvoice({
        invoice_id: selectedInvoice.id,
        reason,
        items: items.filter((i) => i.description && i.quantity > 0),
      })
      if (r.error) { toast.error(r.error); return }
      toast.success(`Credit note ${r.data?.creditNumber} created`)
      router.push(`/credit-invoices/${r.data?.creditId}`)
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <ButtonLink href="/credit-invoices" variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4" />Back
      </ButtonLink>

      <div className="flex items-center gap-3">
        <FileMinus className="h-6 w-6 text-warning" />
        <h2 className="text-xl font-semibold text-foreground">New Credit Note</h2>
      </div>

      <Card className="border-warning/30 bg-[var(--badge-warning-bg)]/40">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          A credit note must reference an existing issued or paid invoice. The original invoice is <strong>never modified</strong>.
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader><CardTitle className="text-base">Original Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice to credit *</Label>
              <Select value={selectedInvoice?.id ?? ''} onValueChange={handleSelectInvoice} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} — {inv.customer?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedInvoice && (
              <div className="text-sm text-muted-foreground">
                Customer: <strong className="text-foreground">{selectedInvoice.customer?.name}</strong>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Returned items, billing error…" rows={2} disabled={isPending} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Items to Credit</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { invoice_item_id: null, description: '', quantity: 1, unit_price: 0 }])} disabled={isPending} className="text-xs">
                <Plus className="h-3.5 w-3.5" />Add line
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Input placeholder="Description" value={item.description} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], description: e.target.value }; setItems(u) }} disabled={isPending} className="text-sm" />
                </div>
                <div className="w-16">
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], quantity: parseInt(e.target.value) || 1 }; setItems(u) }} disabled={isPending} />
                </div>
                <div className="w-24">
                  <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], unit_price: parseFloat(e.target.value) || 0 }; setItems(u) }} disabled={isPending} />
                </div>
                <div className="w-24 text-sm font-medium text-foreground h-10 flex items-center">
                  {formatCurrency(item.quantity * item.unit_price)}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end pt-3 border-t border-border">
              <p className="text-base font-bold text-destructive">Credit total: −{formatCurrency(subtotal)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/credit-invoices"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={isPending || !selectedInvoice}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Credit Note'}
          </Button>
        </div>
      </form>
    </div>
  )
}
