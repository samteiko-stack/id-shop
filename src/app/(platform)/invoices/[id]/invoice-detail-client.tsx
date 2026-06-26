'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice } from '@/types'
import { useRole } from '@/hooks/use-role'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Separator } from '@/components/ui/separator'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { getCustomerFacingLineItems } from '@/lib/discounts'
import { attachLotNumbersFromOrder } from '@/lib/trace/lot-display'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle2, FileMinus, FileText, Loader2, MoreVertical, XCircle } from '@/components/icons'
import { updateInvoiceStatus, sendInvoiceEmail } from '../actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PaymentSection } from './payment-section'
import { addPayment } from './payment-actions'
import type { Payment } from '@/types'

export function InvoiceDetailClient({
  invoice,
  credits,
  payments,
  paymentSummary,
}: {
  invoice: Invoice & { customer: any; items: any[]; order: any }
  credits: any[]
  payments: Payment[]
  paymentSummary: {
    total: number
    credited: number
    paid: number
    netTotal: number
    balance: number
    refundDue: number
    status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'credited' | 'refund_due'
  } | null
}) {
  const router = useRouter()
  const { canWrite, canCancelInvoice, isAdmin } = useRole()
  const [isPending, startTransition] = useTransition()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [confirmPaid, setConfirmPaid] = useState(false)

  const discountRate = Number((invoice as any).discount_rate ?? 0)
  const extraDiscountRate = Number((invoice as any).extra_discount_rate ?? 0)
  const extraDiscountAmount = Number((invoice as any).extra_discount_amount ?? 0)
  const facingItems = attachLotNumbersFromOrder(
    getCustomerFacingLineItems(invoice.items ?? [], discountRate),
    invoice.order?.items ?? [],
  )
  const netSubtotal = facingItems.reduce((sum, item) => sum + item.net_line_total, 0)
  const isCancelled = invoice.status === 'cancelled'
  const displayStatus = isCancelled ? 'cancelled' : (paymentSummary?.status ?? 'unpaid')

  function handleSend() { setConfirmSend(true) }
  function doSend() {
    startTransition(async () => {
      const r = await sendInvoiceEmail(invoice.id)
      if (r.error) { toast.error(r.error); return }
      toast.success('Invoice sent to customer')
      router.refresh()
    })
  }

  function handleMarkPaid() { setConfirmPaid(true) }
  function doMarkPaid() {
    if (!paymentSummary) return
    startTransition(async () => {
      const r = await addPayment({
        invoice_id: invoice.id,
        amount: paymentSummary.balance,
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
      })
      if (r.error) { toast.error(r.error); return }
      toast.success('Payment recorded successfully')
      router.refresh()
    })
  }

  function handleCancel() {
    setConfirmCancel(true)
  }

  function doCancel() {
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoice.id, 'cancelled')
      if (r.error) { toast.error(r.error); return }
      toast.success('Invoice cancelled')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ButtonLink href="/invoices" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />Back to Invoices
        </ButtonLink>
        <div className="flex items-center gap-2">
          {paymentSummary && paymentSummary.balance > 0 && !isCancelled && canWrite && (
            <Button onClick={handleMarkPaid} disabled={isPending} size="sm">
              <CheckCircle2 className="h-4 w-4" />Mark as Paid
            </Button>
          )}

          <ActionsMenu
            disabled={isPending}
            actions={[
              {
                label: 'Preview PDF',
                icon: <FileText className="h-4 w-4" />,
                onClick: () => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank'),
                show: canWrite,
              },
              {
                label: 'Email to Customer',
                icon: <Send className="h-4 w-4" />,
                onClick: handleSend,
                show: !isCancelled && canWrite && !!invoice.customer?.email,
              },
              {
                label: 'Create Credit Invoice',
                icon: <FileMinus className="h-4 w-4" />,
                onClick: () => router.push(`/credit-invoices/new?invoice=${invoice.id}`),
                show: !isCancelled && canWrite,
              },
              {
                items: [
                  {
                    label: 'Cancel Invoice',
                    icon: <XCircle className="h-4 w-4" />,
                    onClick: handleCancel,
                    variant: 'destructive' as const,
                    show: isAdmin && !isCancelled,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* Invoice header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground mt-1">{formatDateTime(invoice.created_at)}</p>
          {invoice.order && (
            <Link href={`/orders/${invoice.order.id ?? invoice.order_id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
              From order {invoice.order.order_number}
            </Link>
          )}
        </div>
        <StatusBadge status={displayStatus} type={isCancelled ? 'invoice' : 'payment'} className="text-sm px-3 py-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bill To</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <Link href={`/customers/${invoice.customer?.id}`} className="text-base font-semibold text-primary hover:underline">{invoice.customer?.name}</Link>
            {invoice.customer?.tax_id && <p className="text-sm text-muted-foreground">Tax ID: {invoice.customer.tax_id}</p>}
            {invoice.customer?.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
            {invoice.customer?.address && <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dates</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Issue date</span><span className="font-medium">{invoice.issue_date ? formatDate(invoice.issue_date) : '—'}</span></div>
            {invoice.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due date</span><span className="font-medium">{formatDate(invoice.due_date)}</span></div>}
            {invoice.sent_at && <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span className="font-medium">{formatDate(invoice.sent_at)}</span></div>}
            {invoice.paid_at && <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-success">{formatDate(invoice.paid_at)}</span></div>}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(netSubtotal, invoice.currency)}</span></div>
            {extraDiscountRate > 0 && (
              <div className="flex justify-between text-[var(--success-600)]">
                <span>Extra discount ({extraDiscountRate}%)</span>
                <span>−{formatCurrency(extraDiscountAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">VAT ({invoice.tax_rate}%)</span><span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span className="text-foreground">Total</span><span className="text-primary">{formatCurrency(invoice.total, invoice.currency)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div>
            <div className="grid grid-cols-[1fr_120px_80px_120px_120px] px-6 py-3 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-b border-border">
              <span>Description</span>
              <span>Lot No.</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Total</span>
            </div>
            {facingItems.map((item: any) => (
              <div key={item.id} className="grid grid-cols-[1fr_120px_80px_120px_120px] px-6 py-4 border-b border-border last:border-0 items-center">
                <span className="text-sm text-foreground">{item.description}</span>
                <span className="text-sm font-mono text-muted-foreground">{item.lot_numbers || '—'}</span>
                <span className="text-sm text-muted-foreground text-right">{item.quantity}</span>
                <span className="text-sm text-foreground text-right">{formatCurrency(item.net_unit_price, invoice.currency)}</span>
                <span className="text-sm font-semibold text-foreground text-right">{formatCurrency(item.net_line_total, invoice.currency)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      {paymentSummary && !isCancelled && (
        <Card className="border-border shadow-sm">
          <CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader>
          <CardContent>
            <PaymentSection
              invoiceId={invoice.id}
              payments={payments}
              summary={paymentSummary}
            />
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-border shadow-sm">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">This invoice has been cancelled. Payments cannot be recorded.</p>
          </CardContent>
        </Card>
      )}

      {/* Credit invoices */}
      {credits.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileMinus className="h-4 w-4 text-warning" />Credits ({credits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {credits.map((c: any) => (
                <Link key={c.id} href={`/credit-invoices/${c.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--table-row-hover)] transition-colors">
                  <span className="text-sm font-medium text-primary">{c.credit_number}</span>
                  <span className="text-sm font-semibold text-foreground">−{formatCurrency(c.total)}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title="Email invoice to customer?"
        description={`Invoice ${invoice.invoice_number} will be emailed to ${invoice.customer?.email ?? 'the customer'}.`}
        confirmLabel="Send Email"
        variant="warning"
        onConfirm={doSend}
      />

      <ConfirmDialog
        open={confirmPaid}
        onOpenChange={setConfirmPaid}
        title="Record full payment?"
        description={paymentSummary ? `A payment of ${paymentSummary.balance.toFixed(2)} kr will be recorded for invoice ${invoice.invoice_number} with today's date.` : ''}
        confirmLabel="Record Payment"
        variant="default"
        onConfirm={doMarkPaid}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel invoice?"
        description="This invoice will be marked as cancelled. This action cannot be undone."
        confirmLabel="Cancel Invoice"
        onConfirm={doCancel}
      />
    </div>
  )
}
