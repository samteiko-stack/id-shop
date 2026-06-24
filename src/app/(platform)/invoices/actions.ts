'use server'

import { createClient } from '@/lib/supabase/server'
import { invoiceSchema, type InvoiceInput } from '@/lib/validators'
import { writeAuditLog } from '@/lib/audit'
import type { InvoiceStatus } from '@/types'
import { revalidatePath } from 'next/cache'
import { requireAdminAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'
import { parseDefaultTaxRate } from '@/lib/tax'

export async function createInvoice(input: InvoiceInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = invoiceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const { items, ...invoiceData } = parsed.data

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = Math.round(subtotal * invoiceData.tax_rate) / 100
  const total = subtotal + taxAmount

  // Generate invoice number
  const { data: invoiceNumber, error: seqError } = await supabase
    .rpc('next_sequence_number', { p_type: 'invoice', p_prefix: 'INV' })
  if (seqError) return { error: seqError.message }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      total,
      status: 'issued',
      created_by: auth.userId,
    })
    .select()
    .single()

  if (invoiceError) return { error: invoiceError.message }

  const { error: itemsError } = await supabase.from('invoice_items').insert(
    items.map((item) => ({
      ...item,
      invoice_id: invoice.id,
      line_total: item.quantity * item.unit_price,
    }))
  )

  if (itemsError) return { error: itemsError.message }

  await writeAuditLog({
    tableName: 'invoices',
    recordId: invoice.id,
    action: 'INSERT',
    newData: { invoice_number: invoiceNumber, total, customer_id: invoiceData.customer_id },
  })

  revalidateDashboard()
  return { data: { invoiceId: invoice.id, invoiceNumber } }
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, extra?: { paid_at?: string; sent_at?: string }) {
  const auth = status === 'cancelled'
    ? await requireAdminAccess()
    : await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
  if (error) return { error: error.message }
  revalidateDashboard()
  return {}
}

export async function sendInvoiceEmail(invoiceId: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*, customer:customers(name, email), items:invoice_items(*)')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice not found' }
  if (!invoice.customer?.email) return { error: 'Customer has no email address' }

  // Get company settings
  const { data: settings } = await supabase.from('settings').select('value').eq('key', 'company').single()
  const company = (settings?.value as any) ?? { name: 'ID Shop' }

  try {
    // Generate PDF
    const { generateInvoicePDF } = await import('@/lib/pdf')
    const pdfBuffer = await generateInvoicePDF({ ...invoice, customer: invoice.customer, items: invoice.items } as any, company)
    
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const formattedAmount = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: invoice.currency }).format(invoice.total)
    const formattedDueDate = invoice.due_date 
      ? new Date(invoice.due_date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
      : null

    await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME ?? company.name} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'}>`,
      to: invoice.customer.email,
      subject: `Faktura ${invoice.invoice_number} från ${company.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .amount { font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
            a.button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${company.name}</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 10px;">Hej ${invoice.customer.name},</p>
            <p>Din faktura är nu tillgänglig för betalning.</p>
            
            <div class="card">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Fakturanummer</div>
              <div style="font-size: 18px; font-weight: 600;">${invoice.invoice_number}</div>
              <div style="margin-top: 20px; font-size: 14px; color: #64748b;">Totalt belopp</div>
              <div class="amount">${formattedAmount}</div>
              ${formattedDueDate ? `
                <div style="margin-top: 20px;">
                  <div style="font-size: 14px; color: #64748b;">Förfallodatum</div>
                  <div style="font-size: 16px; font-weight: 600; color: #dc2626;">${formattedDueDate}</div>
                </div>
              ` : ''}
            </div>

            <p>Fakturan finns bifogad som PDF. Vid frågor är du välkommen att kontakta oss.</p>
            
            <div class="footer">
              <p>Tack för ditt förtroende!</p>
              <p style="margin: 5px 0;"><strong>${company.name}</strong></p>
              ${company.email ? `<p style="margin: 0;">${company.email}</p>` : ''}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [{
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
      }],
    })

    await supabase
      .from('invoices')
      .update({ sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', invoiceId)

    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/invoices')
    revalidateDashboard()
    return {}
  } catch (err: any) {
    console.error('[Send Invoice Email]', err)
    return { error: err?.message ?? 'Failed to send email' }
  }
}

export async function loadInvoiceCreateOptions() {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const [customersResult, ordersResult, taxRateResult] = await Promise.all([
    supabase.from('customers').select('id, name').is('deleted_at', null).order('name'),
    supabase
      .from('orders')
      .select('id, order_number, customer_id')
      .eq('status', 'fulfilled')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('settings').select('value').eq('key', 'default_tax_rate').single(),
  ])

  return {
    customers: customersResult.data ?? [],
    orders: ordersResult.data ?? [],
    defaultTaxRate: parseDefaultTaxRate(taxRateResult.data?.value),
  }
}
