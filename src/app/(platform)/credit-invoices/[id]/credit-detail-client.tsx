'use client'

import Link from 'next/link'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageContainer } from '@/components/layout/page-container'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, FileText } from '@/components/icons'
import type { CreditInvoice } from '@/types'
import { useRole } from '@/hooks/use-role'

type CreditWithRelations = CreditInvoice & {
  customer?: { id: string; name: string; email?: string | null; address?: string | null; tax_id?: string | null }
  invoice?: { id: string; invoice_number: string; currency?: string }
  items?: Array<{ id: string; description: string; quantity: number; unit_price: number; line_total: number }>
}

export function CreditDetailClient({ credit }: { credit: CreditWithRelations }) {
  const { canWrite } = useRole()
  const currency = credit.invoice?.currency ?? 'EUR'

  return (
    <PageContainer>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ButtonLink href="/credit-invoices" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Credit Notes
        </ButtonLink>
        {canWrite && credit.invoice_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/invoices/${credit.invoice_id}/pdf`, '_blank')}
          >
            <FileText className="h-4 w-4" />
            Original Invoice PDF
          </Button>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{credit.credit_number}</h2>
          <p className="text-sm text-muted-foreground mt-1">{formatDateTime(credit.created_at)}</p>
          {credit.invoice && (
            <Link
              href={`/invoices/${credit.invoice.id ?? credit.invoice_id}`}
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Credit for invoice {credit.invoice.invoice_number}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {credit.customer && (
              <Link href={`/customers/${credit.customer.id}`} className="text-base font-semibold text-primary hover:underline">
                {credit.customer.name}
              </Link>
            )}
            {credit.customer?.email && <p className="text-sm text-muted-foreground">{credit.customer.email}</p>}
            {credit.customer?.address && <p className="text-sm text-muted-foreground">{credit.customer.address}</p>}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{credit.reason}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div>
            <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-b border-border">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Total</span>
            </div>
            {(credit.items ?? []).map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-4 border-b border-border last:border-0 items-center">
                <span className="text-sm text-foreground">{item.description}</span>
                <span className="text-sm text-muted-foreground text-right">{item.quantity}</span>
                <span className="text-sm text-foreground text-right">{formatCurrency(item.unit_price, currency)}</span>
                <span className="text-sm font-semibold text-destructive text-right">−{formatCurrency(item.line_total, currency)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm max-w-sm ml-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-destructive">−{formatCurrency(credit.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span className="text-destructive">−{formatCurrency(credit.tax_amount, currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span className="text-foreground">Credit Total</span>
            <span className="text-destructive">−{formatCurrency(credit.total, currency)}</span>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
