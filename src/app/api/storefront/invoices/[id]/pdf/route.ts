import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createCookieClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator'
import {
  buildSwedishCompany,
  fetchInvoiceSettlement,
  INVOICE_PDF_SELECT,
} from '@/lib/pdf/invoice-pdf-context'
import { requireStorefrontCustomer } from '@/lib/storefront/customer-session'

const BUCKET = 'invoices'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStorefrontCustomer()
  if ('error' in session) {
    return NextResponse.json({ error: session.error }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createCookieClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(INVOICE_PDF_SELECT)
    .eq('id', id)
    .eq('customer_id', session.customer.id)
    .is('deleted_at', null)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const [{ data: settingsRow }, { data: invoiceSettingsRow }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'company').single(),
    supabase.from('settings').select('value').eq('key', 'invoice').single(),
  ])

  const company = buildSwedishCompany(settingsRow?.value as Record<string, unknown>)
  const invoiceSettings = (invoiceSettingsRow?.value ?? {}) as Record<string, number>
  company.payment_terms_days = invoiceSettings.payment_terms_days ?? company.payment_terms_days ?? 30

  const settlement = await fetchInvoiceSettlement(supabase, id, Number(invoice.total))
  const pdfBuffer = await generateInvoicePDF({ invoice: invoice as any, company, settlement })

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
