import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreditDetailClient } from '@/app/(platform)/credit-invoices/[id]/credit-detail-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('credit_invoices')
    .select('credit_number')
    .eq('id', id)
    .maybeSingle()

  return { title: data?.credit_number ?? 'Credit Note' }
}

export default async function CreditInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: credit } = await supabase
    .from('credit_invoices')
    .select(`
      *,
      customer:customers(id, name, email, address, tax_id),
      invoice:invoices(id, invoice_number, currency),
      items:credit_invoice_items(*)
    `)
    .eq('id', id)
    .single()

  if (!credit) notFound()

  return <CreditDetailClient credit={credit as any} />
}
