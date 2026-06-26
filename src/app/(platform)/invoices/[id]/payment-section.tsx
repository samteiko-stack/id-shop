'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/lib/toast'
import { addPayment, deletePayment } from './payment-actions'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types'
import { useRole } from '@/hooks/use-role'

interface Props {
  invoiceId: string
  payments: Payment[]
  summary: {
    total: number
    credited: number
    paid: number
    netTotal: number
    balance: number
    refundDue: number
    status: PaymentStatus
  }
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Banknote },
  { value: 'swish', label: 'Swish', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'check', label: 'Check', icon: Receipt },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'other', label: 'Other', icon: Receipt },
]

export function PaymentSection({ invoiceId, payments, summary }: Props) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    amount: summary.balance.toString(),
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await addPayment({
          invoice_id: invoiceId,
          amount: parseFloat(form.amount),
          payment_method: form.payment_method,
          payment_date: form.payment_date,
          reference_number: form.reference_number || undefined,
          notes: form.notes || undefined,
        })
        if (res.error) {
          toast.error(res.error)
          return
        }
        toast.success('Payment recorded')
        setOpen(false)
        setForm({
          amount: summary.balance.toString(),
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: '',
        })
        router.refresh()
      } catch {
        toast.error('Failed to record payment. Please try again.')
      }
    })
  }

  function handleDelete(paymentId: string) {
    if (!confirm('Remove this payment?')) return
    startTransition(async () => {
      try {
        const res = await deletePayment(paymentId, invoiceId)
        if (res.error) {
          toast.error(res.error)
          return
        }
        toast.success('Payment removed')
        router.refresh()
      } catch {
        toast.error('Failed to remove payment. Please try again.')
      }
    })
  }

  const formatCurrency = (val: number) => `${val.toFixed(2)} kr`
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })

  const canRecordPayment = summary.balance > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Settlement</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={summary.status} type="payment" />
            <span className="text-xl font-bold">
              {formatCurrency(summary.paid)} / {formatCurrency(summary.netTotal)}
            </span>
          </div>
        </div>
        {canWrite && (
          <Button onClick={() => setOpen(true)} disabled={!canRecordPayment}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Invoice total</span>
          <span>{formatCurrency(summary.total)}</span>
        </div>
        {summary.credited > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Credits</span>
            <span className="text-destructive">−{formatCurrency(summary.credited)}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-medium">
          <span className="text-muted-foreground">Net amount</span>
          <span>{formatCurrency(summary.netTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Paid</span>
          <span>{formatCurrency(summary.paid)}</span>
        </div>
        {summary.balance > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="font-medium text-muted-foreground">Balance due</span>
            <span className="text-lg font-bold text-destructive">{formatCurrency(summary.balance)}</span>
          </div>
        )}
        {summary.refundDue > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="font-medium text-muted-foreground">Refund due</span>
            <span className="text-lg font-bold text-destructive">{formatCurrency(summary.refundDue)}</span>
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Payment History</p>
          <div className="space-y-2">
            {payments.map((payment) => {
              const method = PAYMENT_METHODS.find((m) => m.value === payment.payment_method)
              const Icon = method?.icon || Receipt
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        {method?.label} • {formatDate(payment.payment_date)}
                        {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                      </p>
                    </div>
                  </div>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(payment.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {canWrite && (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                max={summary.balance}
              />
              <p className="text-xs text-muted-foreground">
                Max: {formatCurrency(summary.balance)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Number (Optional)</Label>
              <Input
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                placeholder="Transaction ID, check number, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}
