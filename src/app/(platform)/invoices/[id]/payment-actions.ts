'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'
import { invalidateInvoicePdf } from '@/lib/pdf/serve-invoice-pdf'
import type { ApiResponse, PaymentMethod } from '@/types'

interface PaymentInput {
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  notes?: string
}

async function fetchInvoiceSettlement(supabase: Awaited<ReturnType<typeof createClient>>, invoiceId: string) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return null

  const [{ data: payments }, { data: credits }] = await Promise.all([
    supabase.from('payments').select('amount').eq('invoice_id', invoiceId).is('deleted_at', null),
    supabase.from('credit_invoices').select('total').eq('invoice_id', invoiceId),
  ])

  const paid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
  const credited = (credits || []).reduce((sum, c) => sum + Number(c.total), 0)

  return computeInvoiceSettlement(Number(invoice.total), paid, credited)
}

export async function addPayment(input: PaymentInput): Promise<ApiResponse> {
  try {
    const auth = await requireWriteAccess()
    if ('error' in auth) return { error: auth.error }

    const supabase = await createClient()

    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: 'Invalid payment amount' }
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, status')
      .eq('id', input.invoice_id)
      .single()

    if (invoiceError || !invoice) return { error: 'Invoice not found' }
    if (invoice.status === 'cancelled') return { error: 'Cannot record payment on a cancelled invoice' }

    const settlementBefore = await fetchInvoiceSettlement(supabase, input.invoice_id)
    if (!settlementBefore) return { error: 'Invoice not found' }

    if (settlementBefore.balanceDue <= 0.001) {
      return { error: 'Nothing left to pay on this invoice' }
    }

    if (amount > settlementBefore.balanceDue + 0.001) {
      return { error: `Payment exceeds balance due. Remaining: ${settlementBefore.balanceDue.toFixed(2)}` }
    }

    const { error } = await supabase.from('payments').insert({
      invoice_id: input.invoice_id,
      amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date,
      reference_number: input.reference_number ?? null,
      notes: input.notes ?? null,
      created_by: auth.userId,
    })

    if (error) return { error: error.message }

    await invalidateInvoicePdf(supabase, input.invoice_id)

    const settlementAfter = await fetchInvoiceSettlement(supabase, input.invoice_id)
    if (settlementAfter && settlementAfter.balanceDue <= 0.001 && settlementAfter.refundDue <= 0.001) {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.invoice_id)
    }

    revalidatePath(`/invoices/${input.invoice_id}`)
    revalidatePath('/invoices')
    revalidateDashboard()
    return {}
  } catch (err) {
    console.error('[addPayment]', err)
    return { error: err instanceof Error ? err.message : 'Failed to record payment' }
  }
}

export async function deletePayment(id: string, invoiceId: string): Promise<ApiResponse> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await invalidateInvoicePdf(supabase, invoiceId)

  const settlement = await fetchInvoiceSettlement(supabase, invoiceId)
  if (settlement) {
    const isSettled = settlement.balanceDue <= 0.001 && settlement.refundDue <= 0.001
    await supabase
      .from('invoices')
      .update({
        status: isSettled ? 'paid' : 'issued',
        paid_at: isSettled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidateDashboard()
  return {}
}

export async function getInvoicePayments(invoiceId: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error, payments: [], summary: null }

  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  const settlement = await fetchInvoiceSettlement(supabase, invoiceId)
  if (!settlement) return { payments: [], summary: null }

  return {
    payments: payments || [],
    summary: {
      total: settlement.total,
      credited: settlement.credited,
      paid: settlement.paid,
      netTotal: settlement.netTotal,
      balance: settlement.balanceDue,
      refundDue: settlement.refundDue,
      status: settlement.status,
    },
  }
}
