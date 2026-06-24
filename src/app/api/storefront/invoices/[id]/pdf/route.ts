import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createCookieClient } from '@/lib/supabase/server'
import { generateInvoicePDF, type SwedishCompany } from '@/lib/pdf/invoice-generator'
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
    .select('*, customer:customers(*), items:invoice_items(*, product:products(name, ref)), order:orders(order_number)')
    .eq('id', id)
    .eq('customer_id', session.customer.id)
    .is('deleted_at', null)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.pdf_url) {
    const admin = await createAdminClient()
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(invoice.pdf_url, 3600)

    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl, { status: 302 })
    }
  }

  const { data: settingsRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'company')
    .single()

  const s = (settingsRow?.value ?? {}) as Record<string, string>
  const company: SwedishCompany = {
    name: s.name ?? 'ID Shop',
    address: s.address ?? '',
    org_number: s.org_number ?? s.tax_id ?? '',
    vat_number: s.vat_number ?? (s.tax_id ? `SE${s.tax_id.replace(/\D/g, '')}01` : ''),
    phone: s.phone ?? '',
    email: s.email ?? '',
    bankgiro: s.bankgiro ?? '',
    payment_terms_days: s.payment_terms_days ? Number(s.payment_terms_days) : 30,
  }

  const pdfBuffer = await generateInvoicePDF({ invoice: invoice as any, company })

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
