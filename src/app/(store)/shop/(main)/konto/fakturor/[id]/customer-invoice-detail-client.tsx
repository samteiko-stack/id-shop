'use client'

import Link from 'next/link'
import { ArrowLeft, FileDown } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getStatusStyles } from '@/lib/status-config'
import { storefrontStatusLabel } from '@/lib/storefront/account-types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export function CustomerInvoiceDetailClient({
  invoice,
}: {
  invoice: {
    id: string
    invoice_number: string
    status: string
    payment_status: string
    currency: string
    issue_date: string | null
    due_date: string | null
    subtotal: number
    tax_amount: number
    total: number
    paid_amount: number
    balance_due: number
    items: InvoiceItem[]
    order_number: string | null
  }
}) {
  const status = invoice.status === 'cancelled' ? 'cancelled' : invoice.payment_status

  return (
    <>
      <StorefrontPageHero
        eyebrow="Faktura"
        title={invoice.invoice_number}
        backLink={{ href: '/shop/konto?tab=fakturor', label: 'Tillbaka till fakturor' }}
        lead={
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              getStatusStyles(status),
            )}>
              {storefrontStatusLabel(status)}
            </span>
            {invoice.issue_date && (
              <span className="text-sm text-white/70">Utfärdad {formatDate(invoice.issue_date)}</span>
            )}
          </div>
        }
      />

      <StorefrontContainer pageSpacing className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/storefront/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <FileDown className="h-4 w-4" />
            Ladda ner PDF
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Totalt</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(invoice.total, invoice.currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Betalt</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(invoice.paid_amount, invoice.currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Kvar att betala</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(invoice.balance_due, invoice.currency)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fakturarader</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatCurrency(item.line_total, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delsumma</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Moms</span>
              <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Totalt</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            {invoice.due_date && (
              <p className="text-xs text-muted-foreground pt-2">
                Förfallodatum: {formatDate(invoice.due_date)}
              </p>
            )}
            {invoice.order_number && (
              <p className="text-xs text-muted-foreground">
                Kopplad beställning: {invoice.order_number}
              </p>
            )}
          </CardContent>
        </Card>

        <Link href="/shop/konto?tab=fakturor" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Alla fakturor
        </Link>
      </StorefrontContainer>
    </>
  )
}
