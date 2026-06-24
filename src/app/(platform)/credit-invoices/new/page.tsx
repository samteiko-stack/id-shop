import { createClient } from '@/lib/supabase/server'
import { NewCreditInvoiceClient } from './new-credit-client'

export const metadata = { title: 'New Credit Invoice' }

export default async function NewCreditInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let originalInvoice = null
  if (params.invoice) {
    const { data } = await supabase
      .from('invoices')
      .select('*, customer:customers(id, name), items:invoice_items(*)')
      .eq('id', params.invoice)
      .single()
    originalInvoice = data
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_id, customer:customers(name), items:invoice_items(*)')
    .in('status', ['issued', 'paid'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <NewCreditInvoiceClient
      invoices={(invoices as any[]) ?? []}
      selectedInvoice={originalInvoice as any}
    />
  )
}
