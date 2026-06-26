import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator'
import {
  buildSwedishCompany,
  fetchInvoiceSettlement,
  INVOICE_PDF_SELECT,
} from '@/lib/pdf/invoice-pdf-context'

const BUCKET = 'invoices'

/** Clear cached PDF so the next download regenerates from live data. */
export async function invalidateInvoicePdf(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<void> {
  await supabase.from('invoices').update({ pdf_url: null }).eq('id', invoiceId)
}

async function loadCompanySettings(supabase: SupabaseClient) {
  const [{ data: companyRow }, { data: invoiceRow }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'company').single(),
    supabase.from('settings').select('value').eq('key', 'invoice').single(),
  ])

  const company = buildSwedishCompany(companyRow?.value as Record<string, unknown>)
  const invoiceSettings = (invoiceRow?.value ?? {}) as Record<string, number>
  company.payment_terms_days = invoiceSettings.payment_terms_days ?? company.payment_terms_days ?? 30
  return company
}

async function tryRedirectToCachedPdf(pdfUrl: string | null | undefined): Promise<NextResponse | null> {
  if (!pdfUrl) return null

  try {
    const admin = await createAdminClient()
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(pdfUrl, 3600)
    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl, {
        status: 302,
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }
  } catch {
    // Fall through to regeneration
  }

  return null
}

async function generateAndCacheInvoicePdf(
  supabase: SupabaseClient,
  invoice: Record<string, unknown> & { id: string; invoice_number: string; total: number },
) {
  const company = await loadCompanySettings(supabase)
  const settlement = await fetchInvoiceSettlement(supabase, invoice.id, Number(invoice.total))
  const pdfBuffer = await generateInvoicePDF({
    invoice: invoice as any,
    company,
    settlement,
  })

  try {
    const admin = await createAdminClient()
    const year = new Date().getFullYear()
    const path = `${year}/${invoice.invoice_number}.pdf`

    await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    await supabase.from('invoices').update({ pdf_url: path }).eq('id', invoice.id)
  } catch {
    // Non-fatal: still serve the freshly generated PDF
  }

  return pdfBuffer
}

export async function serveInvoicePdf(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<NextResponse> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(INVOICE_PDF_SELECT)
    .eq('id', invoiceId)
    .is('deleted_at', null)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const cached = await tryRedirectToCachedPdf(invoice.pdf_url)
  if (cached) return cached

  const pdfBuffer = await generateAndCacheInvoicePdf(supabase, invoice)

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

/** Always build a fresh PDF (e.g. email attachments). Does not read from cache. */
export async function buildFreshInvoicePdf(
  supabase: SupabaseClient,
  invoiceId: string,
): Promise<{ buffer: Buffer; invoice_number: string } | { error: string }> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(INVOICE_PDF_SELECT)
    .eq('id', invoiceId)
    .is('deleted_at', null)
    .single()

  if (error || !invoice) return { error: 'Invoice not found' }

  const pdfBuffer = await generateAndCacheInvoicePdf(supabase, invoice)
  return { buffer: pdfBuffer, invoice_number: invoice.invoice_number }
}
