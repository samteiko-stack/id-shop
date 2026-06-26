import type { SupabaseClient } from '@supabase/supabase-js'
import { toUserError } from '@/lib/user-error-message'

/** Linked invoices use the same reference as the sale order number. */
export async function invoiceNumberForOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<{ number: string } | { error: string }> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (error || !order?.order_number) {
    return { error: toUserError(error, 'Sale not found.') }
  }

  return { number: order.order_number }
}

/** Keep a linked invoice's number in sync with its sale reference. */
export async function ensureInvoiceMatchesOrderNumber(
  supabase: SupabaseClient,
  invoiceId: string,
  orderId: string,
): Promise<{ invoiceNumber: string } | { error: string }> {
  const resolved = await invoiceNumberForOrder(supabase, orderId)
  if ('error' in resolved) return resolved

  const { data: current } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', invoiceId)
    .single()

  if (current?.invoice_number === resolved.number) {
    return { invoiceNumber: resolved.number }
  }

  const { data: conflict } = await supabase
    .from('invoices')
    .select('id')
    .eq('invoice_number', resolved.number)
    .neq('id', invoiceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (conflict) {
    return { error: `Reference ${resolved.number} is already used by another invoice` }
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      invoice_number: resolved.number,
      pdf_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (updateError) return { error: toUserError(updateError) }
  return { invoiceNumber: resolved.number }
}
