'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Order, OrderStatus } from '@/types'
import { useRole } from '@/hooks/use-role'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

import { ArrowLeft, FileText, QrCode, CheckCircle2, XCircle, Loader2, Copy, MoreVertical, Printer, Pencil, FileMinus, Archive } from '@/components/icons'
import { updateOrderStatus, duplicateOrder, createInvoiceFromOrder, revertOrderFulfillment, markOrderAsSeen, archiveOrder } from '../actions'
import { ConfirmDialog, type ConfirmVariant } from '@/components/ui/confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'


export function OrderDetailClient({
  order,
  linkedInvoices = [],
}: {
  order: Order & { customer: any; items: any[] }
  linkedInvoices?: Array<{
    id: string
    invoice_number: string
    total: number
    currency?: string
    status: string
    issue_date?: string | null
    created_at: string
    settlement: {
      status: string
      balanceDue: number
      refundDue: number
      credited: number
      paid: number
    }
    credits: Array<{ id: string; credit_number: string; total: number; created_at: string }>
  }>
}) {
  const router = useRouter()
  const { canWrite, isAdmin } = useRole()
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: ConfirmVariant
    onConfirm: () => void
  } | null>(null)
  const markedSeen = useRef(false)

  useEffect(() => {
    if (markedSeen.current) return
    markedSeen.current = true
    void markOrderAsSeen(order.id)
  }, [order.id])

  const subtotal = order.items?.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0) ?? 0
  const discountRate = (order as any).discount_rate ?? 0
  const discountAmount = (order as any).discount_amount ?? 0
  const extraDiscountRate = (order as any).extra_discount_rate ?? 0
  const extraDiscountAmount = (order as any).extra_discount_amount ?? 0
  const grandTotal = subtotal - discountAmount - extraDiscountAmount

  function requestStatusChange(status: OrderStatus) {
    const configs: Record<string, { title: string; description: string; confirmLabel: string; variant: ConfirmVariant }> = {
      confirmed: {
        title: 'Confirm this sale?',
        description: `Sale ${order.order_number} will be confirmed and sent for fulfillment.`,
        confirmLabel: 'Confirm Sale',
        variant: 'default',
      },
      fulfilled: {
        title: 'Mark sale as fulfilled?',
        description: allItemsTraced
          ? `Sale ${order.order_number} will be marked as fulfilled. All items are traced.`
          : `Sale ${order.order_number} has untraced items. You can still mark it as fulfilled, but consider scanning all products first.`,
        confirmLabel: 'Mark Fulfilled',
        variant: 'warning',
      },
      cancelled: {
        title: 'Cancel this sale?',
        description: `Sale ${order.order_number} will be cancelled. This cannot be undone.`,
        confirmLabel: 'Cancel Sale',
        variant: 'destructive',
      },
    }
    const cfg = configs[status]
    if (!cfg) return
    setPendingConfirm({
      ...cfg,
      onConfirm: () => {
        startTransition(async () => {
          const result = await updateOrderStatus(order.id, status)
          if (result.error) { toast.error(result.error); return }
          const invoiceNumber = (result.data as any)?.invoice?.invoiceNumber
          if (status === 'fulfilled' && invoiceNumber) {
            toast.success(`Sale fulfilled · Invoice ${invoiceNumber} created`)
          } else {
            toast.success(`Order ${status}`)
          }
          router.refresh()
        })
      },
    })
  }

  function handleRevertFulfillment() {
    setPendingConfirm({
      title: 'Revert to confirmed?',
      description: hasInvoice
        ? `Sale ${order.order_number} will go back to Confirmed and its linked invoice will be cancelled. Use this if it was marked fulfilled by mistake.`
        : `Sale ${order.order_number} will go back to Confirmed so you can continue editing or tracing items.`,
      confirmLabel: 'Revert to Confirmed',
      variant: 'warning',
      onConfirm: () => {
        startTransition(async () => {
          const result = await revertOrderFulfillment(order.id)
          if (result.error) { toast.error(result.error); return }
          toast.success('Sale reverted to confirmed')
          router.refresh()
        })
      },
    })
  }

  function handleDuplicate() {
    setPendingConfirm({
      title: 'Duplicate this sale?',
      description: `A new draft sale will be created with the same items and customer as ${order.order_number}.`,
      confirmLabel: 'Duplicate Sale',
      variant: 'default',
      onConfirm: () => {
        startTransition(async () => {
          const result = await duplicateOrder(order.id)
          if (result.error) { toast.error(result.error); return }
          toast.success(`Sale duplicated: ${result.data?.orderNumber}`)
          router.push(`/orders/${result.data?.orderId}`)
        })
      },
    })
  }

  function handleCreateInvoice() {
    startTransition(async () => {
      const result = await createInvoiceFromOrder(order.id)
      if (result.error) { toast.error(result.error); return }
      if ((result.data as any)?.wasLinked) {
        toast.success(`Invoice ${result.data?.invoiceNumber} linked to this sale`)
      } else if (result.data?.alreadyExists) {
        toast.success(`Invoice ${result.data?.invoiceNumber} already exists`)
      } else {
        toast.success(`Invoice ${result.data?.invoiceNumber} created`)
      }
      router.refresh()
    })
  }

  function handleArchive() {
    setPendingConfirm({
      title: 'Archive this sale?',
      description: `${order.order_number} will be removed from the sales list. You can restore it from Archive.`,
      confirmLabel: 'Archive',
      variant: 'destructive',
      onConfirm: () => {
        startTransition(async () => {
          const result = await archiveOrder(order.id)
          if (result.error) { toast.error(result.error); return }
          toast.success('Sale archived')
          router.push('/orders')
        })
      },
    })
  }

  const allItemsTraced = order.items?.every((item: any) =>
    item.batches && item.batches.length > 0 &&
    item.batches.reduce((sum: number, b: any) => sum + b.quantity, 0) >= item.quantity
  )

  const primaryInvoice = linkedInvoices[0] ?? null
  const hasInvoice = linkedInvoices.length > 0
  const canRevertFulfillment =
    isAdmin &&
    order.status === 'fulfilled' &&
    (!primaryInvoice ||
      (primaryInvoice.status !== 'paid' &&
        primaryInvoice.status !== 'cancelled' &&
        primaryInvoice.settlement.paid === 0 &&
        primaryInvoice.credits.length === 0))
  const hasOverflowActions =
    canWrite ||
    canRevertFulfillment ||
    (['draft', 'confirmed'].includes(order.status) && isAdmin)

  return (
    <PageContainer>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ButtonLink href="/orders" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />Back to Sales
        </ButtonLink>
        <div className="flex items-center gap-2">
          {canWrite && (
            <ButtonLink href={`/orders/${order.id}/print`} variant="outline" size="sm">
              <Printer className="h-4 w-4" />Print Sale
            </ButtonLink>
          )}

          {/* Edit */}
          {['draft', 'confirmed'].includes(order.status) && canWrite && (
            <ButtonLink href={`/orders/${order.id}/edit`} variant="outline" size="sm">
              <Pencil className="h-4 w-4" />Edit
            </ButtonLink>
          )}

          {/* Primary action button based on order status */}
          {order.status === 'draft' && canWrite && (
            <Button onClick={() => requestStatusChange('confirmed')} disabled={isPending} size="sm">
              <CheckCircle2 className="h-4 w-4" />Confirm Sale
            </Button>
          )}
          {order.status === 'confirmed' && canWrite && (
            <Button onClick={() => requestStatusChange('fulfilled')} disabled={isPending} size="sm">
              <CheckCircle2 className="h-4 w-4" />Mark Fulfilled
            </Button>
          )}
          {order.status === 'fulfilled' && canWrite && (
            hasInvoice && primaryInvoice ? (
              <ButtonLink href={`/invoices/${primaryInvoice.id}`} size="sm">
                <FileText className="h-4 w-4" />View Invoice
              </ButtonLink>
            ) : (
              <Button onClick={handleCreateInvoice} disabled={isPending} size="sm">
                <FileText className="h-4 w-4" />Create Invoice
              </Button>
            )
          )}
          
          {hasOverflowActions && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors" disabled={isPending}>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canWrite && (
                  <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {order.status === 'confirmed' && canWrite && (
                  <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/trace`)} className="gap-2">
                    <QrCode className="h-4 w-4" />
                    Trace Items
                  </DropdownMenuItem>
                )}
                {canRevertFulfillment && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRevertFulfillment} className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Revert to Confirmed
                    </DropdownMenuItem>
                  </>
                )}
                {['draft', 'confirmed'].includes(order.status) && isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => requestStatusChange('cancelled')}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  </>
                )}
                {canWrite && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleArchive} className="gap-2 text-destructive focus:text-destructive">
                      <Archive className="h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
          {primaryInvoice && (
            <Link href={`/invoices/${primaryInvoice.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
              Invoice {primaryInvoice.invoice_number}
            </Link>
          )}
        </div>
        <StatusBadge status={order.status} className="text-sm px-3 py-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Customer</CardTitle></CardHeader>
          <CardContent>
            <Link href={`/customers/${order.customer?.id}`} className="text-base font-semibold text-primary hover:underline">
              {order.customer?.name}
            </Link>
            {order.customer?.email && <p className="text-sm text-muted-foreground mt-1">{order.customer.email}</p>}
            {order.customer?.phone && <p className="text-sm text-muted-foreground">{order.customer.phone}</p>}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Order Total</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discountRate > 0 && (
                <div className="flex justify-between text-sm text-[var(--success-600)]">
                  <span>Customer discount ({discountRate}%)</span>
                  <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {extraDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-[var(--success-600)]">
                  <span>Extra discount ({extraDiscountRate}%)</span>
                  <span className="font-medium">−{formatCurrency(extraDiscountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm font-medium">Grand Total</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{order.items?.length ?? 0} line item{order.items?.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        {/* Traceability status */}
        <Card className={`border shadow-sm ${allItemsTraced ? 'border-[var(--success-500)]/30 bg-[var(--success-100)]/30' : 'border-border'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><QrCode className="h-4 w-4" />Traceability</CardTitle></CardHeader>
          <CardContent>
            {allItemsTraced ? (
              <p className="text-sm font-semibold text-[var(--status-fulfilled-fg)]">All items traced</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Some items need QR scanning</p>
                {order.status === 'confirmed' && canWrite && (
                  <ButtonLink href={`/traceability?order=${order.id}`} size="sm" variant="outline" className="text-xs mt-2">
                    <QrCode className="h-3.5 w-3.5" />Scan products
                  </ButtonLink>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {order.status === 'fulfilled' && !hasInvoice && (
        <Card className="border-border shadow-sm border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <p className="text-sm text-foreground">
              This sale has no invoice yet. Create an invoice to send to the customer and record payment.
            </p>
          </CardContent>
        </Card>
      )}

      {hasInvoice && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Related Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {linkedInvoices.map((invoice) => (
                <div key={invoice.id}>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--table-row-hover)] transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-primary">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Invoice · {invoice.issue_date ? formatDate(invoice.issue_date) : formatDate(invoice.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                      <StatusBadge
                        status={invoice.status === 'cancelled' ? 'cancelled' : invoice.settlement.status}
                        type={invoice.status === 'cancelled' ? 'invoice' : 'payment'}
                      />
                    </div>
                  </Link>
                  {invoice.credits.length > 0 && (
                    <div className="border-t border-border bg-muted/20">
                      {invoice.credits.map((credit) => (
                        <Link
                          key={credit.id}
                          href={`/credit-invoices/${credit.id}`}
                          className="flex items-center justify-between px-6 py-3 pl-10 hover:bg-[var(--table-row-hover)] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileMinus className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-primary">{credit.credit_number}</span>
                          </div>
                          <span className="text-sm font-semibold text-destructive">
                            −{formatCurrency(credit.total, invoice.currency)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order items */}
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {order.items?.map((item: any) => {
              const tracedQty = item.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) ?? 0
              const isFullyTraced = tracedQty >= item.quantity
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">REF: {item.product?.ref}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.quantity * item.unit_price)}
                      </p>
                    </div>
                  </div>

                  {/* Batch info */}
                  {item.batches && item.batches.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      {item.batches.map((ob: any) => (
                        <div key={ob.id} className="flex items-center gap-3 text-xs text-muted-foreground bg-[var(--scan-active-bg)] rounded px-2 py-1.5">
                          <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-mono">LOT: {ob.batch?.lot_number}</span>
                          <span>REF: {ob.batch?.ref}</span>
                          <span>Exp: {ob.batch?.expiry_date}</span>
                          <Badge className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0 text-xs ml-auto">
                            Qty: {ob.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isFullyTraced && order.status === 'confirmed' && (
                    <p className="text-xs text-warning mt-1.5 ml-4">
                      {tracedQty}/{item.quantity} units traced
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground">{order.notes}</p></CardContent>
        </Card>
      )}

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
    </PageContainer>
  )
}
