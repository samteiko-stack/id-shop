import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator'
import {
  buildSwedishCompany,
  fetchInvoiceSettlement,
  INVOICE_PDF_SELECT,
} from '@/lib/pdf/invoice-pdf-context'
import { requireWriteAccess } from '@/lib/auth/permissions'

const BUCKET = 'invoices'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriteAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Not authenticated' ? 401 : 403 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(INVOICE_PDF_SELECT)
    .eq('id', id)
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

  // Upload to storage and save path
  try {
    const admin = await createAdminClient()
    const year = new Date().getFullYear()
    const path = `${year}/${invoice.invoice_number}.pdf`

    await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    // Store path on invoice for future requests
    await supabase.from('invoices').update({ pdf_url: path }).eq('id', id)
  } catch {
    // Non-fatal: still serve the PDF even if storage fails
  }

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
