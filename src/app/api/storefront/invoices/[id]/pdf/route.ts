import { NextRequest } from 'next/server'
import { createCookieClient } from '@/lib/supabase/server'
import { serveInvoicePdf } from '@/lib/pdf/serve-invoice-pdf'
import { requireStorefrontCustomer } from '@/lib/storefront/customer-session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStorefrontCustomer()
  if ('error' in session) {
    return Response.json({ error: session.error }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createCookieClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', id)
    .eq('customer_id', session.customer.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return serveInvoicePdf(supabase, id)
}
