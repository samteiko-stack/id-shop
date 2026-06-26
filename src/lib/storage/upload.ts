import { createAdminClient } from '@/lib/supabase/server'

const INVOICE_BUCKET = 'invoices'
const ALLOWED_MIME_TYPES = ['application/pdf']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function uploadInvoicePDF(
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<{ path: string } | { error: string }> {
  if (pdfBuffer.length > MAX_FILE_SIZE_BYTES) {
    return { error: 'PDF file exceeds 10MB size limit' }
  }

  const admin = await createAdminClient()
  const year = new Date().getFullYear()
  const path = `${year}/${invoiceNumber}.pdf`

  const { data, error } = await admin.storage
    .from(INVOICE_BUCKET)
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) return { error: error.message }
  return { path: data.path }
}

export async function uploadCreditPDF(
  creditNumber: string,
  pdfBuffer: Buffer
): Promise<{ path: string } | { error: string }> {
  if (pdfBuffer.length > MAX_FILE_SIZE_BYTES) {
    return { error: 'PDF file exceeds 10MB size limit' }
  }

  const admin = await createAdminClient()
  const year = new Date().getFullYear()
  const path = `credits/${year}/${creditNumber}.pdf`

  const { data, error } = await admin.storage
    .from(INVOICE_BUCKET)
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) return { error: error.message }
  return { path: data.path }
}
