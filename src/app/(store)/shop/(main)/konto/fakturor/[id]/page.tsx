import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { createClient } from '@/lib/supabase/server'
import { shopMeta } from '@/lib/metadata'
import { requireStorefrontCustomerOrRedirect } from '@/lib/storefront/customer-session'
import { CustomerInvoiceDetailClient } from './customer-invoice-detail-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!invoice) return shopMeta.account
  return shopMeta.invoiceDetail(invoice.invoice_number)
}

export default async function CustomerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireStorefrontCustomerOrRedirect('/shop/konto?tab=fakturor')

  const { id } = await params
  const { supabase, customer } = session

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, status, subtotal, tax_amount, total, currency,
      issue_date, due_date,
      items:invoice_items(id, description, quantity, unit_price, line_total),
      payments(amount),
      order:orders(order_number)
    `)
    .eq('id', id)
    .eq('customer_id', customer.id)
    .is('deleted_at', null)
    .single()

  if (!invoice) notFound()

  const { data: credits } = await supabase
    .from('credit_invoices')
    .select('total')
    .eq('invoice_id', id)

  const paid = (invoice.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0)
  const credited = (credits ?? []).reduce((sum, credit) => sum + Number(credit.total), 0)
  const settlement = computeInvoiceSettlement(Number(invoice.total), paid, credited)

  const order = Array.isArray(invoice.order) ? invoice.order[0] : invoice.order

  return (
    <CustomerInvoiceDetailClient
      invoice={{
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        payment_status: settlement.status,
        currency: invoice.currency ?? 'SEK',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        subtotal: Number(invoice.subtotal),
        tax_amount: Number(invoice.tax_amount),
        total: Number(invoice.total),
        paid_amount: paid,
        balance_due: settlement.balanceDue,
        items: (invoice.items ?? []) as Array<{
          id: string
          description: string
          quantity: number
          unit_price: number
          line_total: number
        }>,
        order_number: order?.order_number ?? null,
      }}
    />
  )
}
