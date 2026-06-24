'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { creditInvoiceSchema } from '@/lib/validators'
import { writeAuditLog } from '@/lib/audit'
import { requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'

export async function createCreditInvoice(input: {
  invoice_id: string
  reason: string
  items: Array<{
    invoice_item_id?: string | null
    description: string
    quantity: number
    unit_price: number
  }>
}) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = creditInvoiceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const supabase = await createClient()

  const { invoice_id, reason, items } = parsed.data

  const { data: origInvoice } = await supabase
    .from('invoices')
    .select('customer_id, tax_rate, currency, total, status')
    .eq('id', invoice_id)
    .single()
  if (!origInvoice) return { error: 'Original invoice not found' }
  if (origInvoice.status === 'cancelled') return { error: 'Cannot credit a cancelled invoice' }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = Math.round(subtotal * (origInvoice.tax_rate ?? 0)) / 100
  const total = subtotal + taxAmount

  const { data: existingCredits } = await supabase
    .from('credit_invoices')
    .select('total')
    .eq('invoice_id', invoice_id)

  const existingCreditTotal = (existingCredits ?? []).reduce((s, c) => s + Number(c.total), 0)
  const invoiceTotal = Number(origInvoice.total)
  const remainingCreditable = invoiceTotal - existingCreditTotal

  if (total > remainingCreditable + 0.001) {
    return {
      error: remainingCreditable <= 0
        ? 'This invoice has already been fully credited'
        : `Credit exceeds remaining amount. Maximum creditable: ${remainingCreditable.toFixed(2)}`,
    }
  }

  const { data: creditNumber, error: seqError } = await supabase
    .rpc('next_sequence_number', { p_type: 'credit', p_prefix: 'CRED' })
  if (seqError) return { error: seqError.message }

  const { data: credit, error: creditError } = await supabase
    .from('credit_invoices')
    .insert({
      credit_number: creditNumber,
      invoice_id,
      customer_id: origInvoice.customer_id,
      reason,
      subtotal,
      tax_amount: taxAmount,
      total,
      status: 'applied',
      created_by: auth.userId,
    })
    .select()
    .single()

  if (creditError) return { error: creditError.message }

  const { error: itemsError } = await supabase.from('credit_invoice_items').insert(
    items.map((item) => ({
      credit_invoice_id: credit.id,
      invoice_item_id: item.invoice_item_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
    }))
  )
  if (itemsError) return { error: itemsError.message }

  await writeAuditLog({
    tableName: 'credit_invoices',
    recordId: credit.id,
    action: 'INSERT',
    newData: { credit_number: creditNumber, invoice_id, total, reason },
  })

  revalidatePath(`/invoices/${invoice_id}`)
  revalidatePath('/invoices')
  revalidateDashboard()

  return { data: { creditId: credit.id, creditNumber } }
}
