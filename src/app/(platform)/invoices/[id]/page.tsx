import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailClient } from './invoice-detail-client'
import { getInvoicePayments } from './payment-actions'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*, product:products(name, ref)), order:orders(id, order_number)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  const { data: credits } = await supabase
    .from('credit_invoices')
    .select('id, credit_number, total, status, created_at')
    .eq('invoice_id', id)

  const paymentData = await getInvoicePayments(id)

  if (!invoice) notFound()

  return (
    <InvoiceDetailClient
      invoice={invoice as any}
      credits={credits ?? []}
      payments={paymentData.payments as any}
      paymentSummary={paymentData.summary}
    />
  )
}
