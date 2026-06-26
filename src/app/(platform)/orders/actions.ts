'use server'

import { createNotification, markOrderNotificationsRead } from '@/lib/notifications'
import { getCurrentUserRole } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { orderSchema, type OrderInput } from '@/lib/validators'
import { writeAuditLog } from '@/lib/audit'
import { resolveOrderInvoices, computeExpectedInvoiceTotal } from '@/lib/order-invoices'
import { computeOrderTotals } from '@/lib/discounts'
import { requireAdminAccess, requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'
import { getOrderArchiveBlockers } from '@/lib/platform/archive-guards'
import { parseDefaultTaxRate } from '@/lib/tax'
import { invalidateInvoicePdf } from '@/lib/pdf/serve-invoice-pdf'
import { mergeOrderLineItems, toUserError } from '@/lib/user-error-message'
import type { OrderStatus } from '@/types'

function actionError(error: unknown, fallback?: string) {
  return { error: toUserError(error, fallback) }
}

async function reactivateCancelledInvoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  invoiceNumber: string,
): Promise<{ error?: string }> {
  const [{ count: paymentCount }, { count: creditCount }] = await Promise.all([
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('invoice_id', invoiceId),
    supabase
      .from('credit_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId)
      .is('deleted_at', null),
  ])

  if ((paymentCount ?? 0) > 0) {
    return { error: `Cannot reactivate invoice ${invoiceNumber}: payments are recorded` }
  }
  if ((creditCount ?? 0) > 0) {
    return { error: `Cannot reactivate invoice ${invoiceNumber}: credit notes exist` }
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'issued',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (error) return actionError(error)

  await invalidateInvoicePdf(supabase, invoiceId)
  return {}
}

export async function createOrder(input: OrderInput) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = orderSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? 'root'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { fieldErrors }
  }

  const supabase = await createClient()
  const mergedItems = mergeOrderLineItems(parsed.data.items)

  // Get customer's discount group
  const { data: customer } = await supabase
    .from('customers')
    .select('discount_group_id, discount_group:discount_groups(discount_rate)')
    .eq('id', parsed.data.customer_id)
    .single()

  const groupRate = Number((customer?.discount_group as { discount_rate?: number } | null)?.discount_rate ?? 0)
  const extraDiscountRate = parsed.data.extra_discount_rate ?? 0
  const totals = computeOrderTotals({
    items: mergedItems,
    discount_rate: groupRate,
    extra_discount_rate: extraDiscountRate,
  })

  // Generate order number
  const { data: orderNumber, error: seqError } = await supabase
    .rpc('next_sequence_number', { p_type: 'order', p_prefix: 'ORD' })
  if (seqError) return actionError(seqError)

  const { items: _items, extra_discount_rate: _edr, ...orderData } = parsed.data

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ 
      ...orderData, 
      order_number: orderNumber, 
      created_by: auth.userId,
      discount_rate: totals.discountRate,
      discount_amount: totals.generalDiscountAmount,
      extra_discount_rate: totals.extraDiscountRate,
      extra_discount_amount: totals.extraDiscountAmount,
    })
    .select()
    .single()

  if (orderError) return actionError(orderError)

  const { error: itemsError } = await supabase.from('order_items').insert(
    mergedItems.map((item) => ({ ...item, order_id: order.id }))
  )

  if (itemsError) {
    await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', order.id)
    return actionError(itemsError)
  }

  const { data: customerRecord } = await supabase
    .from('customers')
    .select('name')
    .eq('id', parsed.data.customer_id)
    .maybeSingle()

  await createNotification({
    type: 'new_order',
    title: `New order ${orderNumber}`,
    body: `${customerRecord?.name ?? 'Customer'} — order created by staff.`,
    link: `/orders/${order.id}`,
  })

  revalidatePath('/orders')
  revalidateDashboard()
  return { data: { orderId: order.id, orderNumber } }
}

export async function duplicateOrder(orderId: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: originalOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*, items:order_items(product_id, quantity, unit_price)')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !originalOrder) {
    return { error: toUserError(fetchError, 'Order not found.') }
  }

  // Generate new order number
  const { data: orderNumber, error: seqError } = await supabase
    .rpc('next_sequence_number', { p_type: 'order', p_prefix: 'ORD' })
  if (seqError) return actionError(seqError)

  // Create new order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: originalOrder.customer_id,
      status: 'draft',
      notes: originalOrder.notes ? `[Duplicated from ${originalOrder.order_number}] ${originalOrder.notes}` : `Duplicated from ${originalOrder.order_number}`,
      created_by: auth.userId,
      discount_rate: originalOrder.discount_rate ?? 0,
      discount_amount: originalOrder.discount_amount ?? 0,
      extra_discount_rate: originalOrder.extra_discount_rate ?? 0,
      extra_discount_amount: originalOrder.extra_discount_amount ?? 0,
    })
    .select()
    .single()

  if (orderError) return actionError(orderError)

  // Create order items
  const items = mergeOrderLineItems(
    (originalOrder.items as any[]).map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  ).map((item) => ({
    order_id: newOrder.id,
    ...item,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(items)

  if (itemsError) {
    await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', newOrder.id)
    return actionError(itemsError)
  }

  revalidateDashboard()
  return { data: { orderId: newOrder.id, orderNumber } }
}

export async function updateOrder(
  orderId: string,
  input: {
    customer_id: string
    notes: string | null
    items: { id?: string; product_id: string; quantity: number; unit_price: number }[]
    extra_discount_rate?: number
  }
) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('discount_group_id, discount_group:discount_groups(discount_rate)')
    .eq('id', input.customer_id)
    .single()

  const groupRate = Number((customer?.discount_group as { discount_rate?: number } | null)?.discount_rate ?? 0)
  const extraDiscountRate = input.extra_discount_rate ?? 0
  const mergedItems = mergeOrderLineItems(input.items)
  const totals = computeOrderTotals({
    items: mergedItems,
    discount_rate: groupRate,
    extra_discount_rate: extraDiscountRate,
  })

  const { items: _items, extra_discount_rate: _edr, ...orderData } = input

  const { error: orderError } = await supabase
    .from('orders')
    .update({ 
      ...orderData, 
      updated_at: new Date().toISOString(),
      discount_rate: totals.discountRate,
      discount_amount: totals.generalDiscountAmount,
      extra_discount_rate: totals.extraDiscountRate,
      extra_discount_amount: totals.extraDiscountAmount,
    })
    .eq('id', orderId)

  if (orderError) return actionError(orderError)

  // Service role: platform RLS has no DELETE on order_items (see migration 033).
  // Auth is already enforced above via requireWriteAccess.
  const admin = await createAdminClient()

  const { error: deleteError } = await admin
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  if (deleteError) return actionError(deleteError)

  const { error: itemsError } = await admin.from('order_items').insert(
    mergedItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) return actionError(itemsError)

  revalidateDashboard()
  return { success: true }
}

/** Create an invoice from a fulfilled sale. Idempotent — returns existing invoice if one exists. */
export async function createInvoiceFromOrder(orderId: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('invoices')
    .select('id, invoice_number, status')
    .eq('order_id', orderId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'cancelled') {
      const reactivated = await reactivateCancelledInvoice(supabase, existing.id, existing.invoice_number)
      if ('error' in reactivated && reactivated.error) return { error: reactivated.error }

      revalidatePath(`/orders/${orderId}`)
      revalidatePath('/orders')
      revalidatePath('/invoices')
      revalidatePath(`/invoices/${existing.id}`)
      revalidateDashboard()

      return {
        data: {
          invoiceId: existing.id,
          invoiceNumber: existing.invoice_number,
          reactivated: true,
        },
      }
    }

    return { data: { invoiceId: existing.id, invoiceNumber: existing.invoice_number, alreadyExists: true } }
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id, status, created_at, discount_rate, discount_amount, extra_discount_rate, extra_discount_amount, items:order_items(product_id, quantity, unit_price, product:products(name, ref))')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (!order) return { error: 'Sale not found' }
  if (order.status !== 'fulfilled') return { error: 'Invoice can only be created for fulfilled sales' }

  const items = (order.items as any[]) ?? []
  if (items.length === 0) return { error: 'Sale has no line items' }

  const linked = await resolveOrderInvoices(supabase, {
    id: order.id,
    customer_id: order.customer_id,
    created_at: order.created_at,
    discount_rate: order.discount_rate,
    discount_amount: order.discount_amount,
    extra_discount_rate: order.extra_discount_rate,
    extra_discount_amount: order.extra_discount_amount,
    items,
  })

  if (linked.length > 0) {
    const linkedInvoice = linked[0]
    if (linkedInvoice.status === 'cancelled') {
      const reactivated = await reactivateCancelledInvoice(
        supabase,
        linkedInvoice.id,
        linkedInvoice.invoice_number,
      )
      if ('error' in reactivated && reactivated.error) return { error: reactivated.error }

      revalidatePath(`/orders/${orderId}`)
      revalidatePath('/orders')
      revalidatePath('/invoices')
      revalidatePath(`/invoices/${linkedInvoice.id}`)
      revalidateDashboard()

      return {
        data: {
          invoiceId: linkedInvoice.id,
          invoiceNumber: linkedInvoice.invoice_number,
          reactivated: true,
        },
      }
    }

    return {
      data: {
        invoiceId: linked[0].id,
        invoiceNumber: linked[0].invoice_number,
        alreadyExists: true,
        wasLinked: true,
      },
    }
  }

  const { data: taxSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'default_tax_rate')
    .single()

  const taxRate = parseDefaultTaxRate(taxSetting?.value)
  const itemsSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const discountRate = Number(order.discount_rate ?? 0)
  const discountAmount = Number(order.discount_amount ?? 0)
  const extraDiscountRate = Number(order.extra_discount_rate ?? 0)
  const extraDiscountAmount = Number(order.extra_discount_amount ?? 0)
  const total = computeExpectedInvoiceTotal(
    { items, discount_rate: discountRate, discount_amount: discountAmount, extra_discount_rate: extraDiscountRate },
    taxRate,
  )
  const taxableSubtotal = Math.max(0, itemsSubtotal - discountAmount - extraDiscountAmount)
  const taxAmount = Math.round(taxableSubtotal * taxRate) / 100
  const issueDate = new Date().toISOString().split('T')[0]

  const { data: invoiceNumber, error: seqError } = await supabase
    .rpc('next_sequence_number', { p_type: 'invoice', p_prefix: 'INV' })
  if (seqError) return actionError(seqError)

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      order_id: orderId,
      customer_id: order.customer_id,
      invoice_number: invoiceNumber,
      subtotal: itemsSubtotal,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      extra_discount_rate: extraDiscountRate,
      extra_discount_amount: extraDiscountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      currency: 'SEK',
      status: 'issued',
      issue_date: issueDate,
      created_by: auth.userId,
    })
    .select('id')
    .single()

  if (invoiceError) return actionError(invoiceError)

  const { error: itemsError } = await supabase.from('invoice_items').insert(
    items.map((item) => {
      const ref = item.product?.ref?.trim()
      const name = item.product?.name ?? 'Artikel'
      const description = ref ? `${ref} - ${name}` : name
      return {
        invoice_id: invoice.id,
        product_id: item.product_id ?? null,
        description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      }
    }),
  )

  if (itemsError) {
    await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', invoice.id)
    return actionError(itemsError)
  }

  await writeAuditLog({
    tableName: 'invoices',
    recordId: invoice.id,
    action: 'INSERT',
    newData: { invoice_number: invoiceNumber, order_id: orderId, total },
  })

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoice.id}`)
  revalidateDashboard()

  return { data: { invoiceId: invoice.id, invoiceNumber, alreadyExists: false } }
}

export async function revertOrderFulfillment(orderId: string) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, order_number')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (!order) return { error: 'Sale not found' }
  if (order.status !== 'fulfilled') return { error: 'Only fulfilled sales can be reverted' }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status')
    .eq('order_id', orderId)
    .is('deleted_at', null)

  for (const invoice of invoices ?? []) {
    if (invoice.status === 'paid') {
      return { error: `Cannot revert: invoice ${invoice.invoice_number} is marked paid` }
    }
    if (invoice.status === 'cancelled') continue

    const [{ count: paymentCount }, { count: creditCount }] = await Promise.all([
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('invoice_id', invoice.id),
      supabase.from('credit_invoices').select('id', { count: 'exact', head: true }).eq('invoice_id', invoice.id).is('deleted_at', null),
    ])

    if ((paymentCount ?? 0) > 0) {
      return { error: `Cannot revert: invoice ${invoice.invoice_number} has payments recorded` }
    }
    if ((creditCount ?? 0) > 0) {
      return { error: `Cannot revert: invoice ${invoice.invoice_number} has credit notes` }
    }

    const { error: cancelError } = await supabase
      .from('invoices')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', invoice.id)

    if (cancelError) return actionError(cancelError)
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return actionError(error)

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/invoices')
  revalidateDashboard()

  return { data: { orderNumber: order.order_number } }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: current } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (!current) return { error: 'Sale not found' }

  if (current.status === 'fulfilled' && status !== 'fulfilled') {
    return {
      error: 'A fulfilled sale cannot be changed back from here. Use "Revert to Confirmed" if it was marked by mistake.',
    }
  }

  if (current.status === 'cancelled' && status !== 'cancelled') {
    return { error: 'A cancelled sale cannot be reactivated' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) return actionError(error)

  if (status === 'fulfilled') {
    const invoiceResult = await createInvoiceFromOrder(orderId)
    if ('error' in invoiceResult) return { error: invoiceResult.error }
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/orders')
    revalidateDashboard()
    return { data: { invoice: invoiceResult.data } }
  }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidateDashboard()
  return {}
}

export async function getOrderArchiveHints(orderId: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const result = await getOrderArchiveBlockers(supabase, orderId, auth.role)
  if (result.error) return { error: result.error, warnings: result.warnings }
  return { warnings: result.warnings ?? [] }
}

export async function archiveOrder(orderId: string): Promise<{ error?: string }> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const blockers = await getOrderArchiveBlockers(supabase, orderId, auth.role)
  if (blockers.error) return { error: blockers.error }

  const { data: order } = await supabase
    .from('orders')
    .select('id, deleted_at')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (!order) return { error: 'Sale not found or already archived' }

  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return actionError(error)
  revalidatePath('/archive')
  revalidatePath('/orders')
  revalidatePath('/orders/archive')
  revalidatePath(`/orders/${orderId}`)
  revalidateDashboard()
  return {}
}

/** @deprecated Use archiveOrder */
export async function softDeleteOrder(orderId: string) {
  return archiveOrder(orderId)
}

export async function restoreOrder(orderId: string): Promise<{ error?: string }> {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .not('deleted_at', 'is', null)
    .single()

  if (!order) return { error: 'Archived sale not found' }

  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return actionError(error)
  revalidatePath('/archive')
  revalidatePath('/orders')
  revalidatePath('/orders/archive')
  revalidatePath(`/orders/${orderId}`)
  revalidateDashboard()
  return {}
}

export async function permanentDeleteOrder(
  orderId: string,
): Promise<{ error?: string }> {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      deleted_at,
      items:order_items(
        id,
        batches:order_item_batches(id)
      )
    `)
    .eq('id', orderId)
    .not('deleted_at', 'is', null)
    .single()

  if (!order) return { error: 'Archived sale not found' }

  const hasBatches = (order.items ?? []).some(
    (item: { batches?: unknown[] }) => (item.batches?.length ?? 0) > 0,
  )
  if (hasBatches) {
    return { error: 'Cannot permanently delete: this sale has LOT/batch traceability records' }
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('order_id', orderId)
    .is('deleted_at', null)

  for (const invoice of invoices ?? []) {
    const { count } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoice.id)
      .is('deleted_at', null)

    if ((count ?? 0) > 0) {
      return {
        error: `Cannot permanently delete: invoice ${invoice.invoice_number} has payments recorded`,
      }
    }
  }

  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) return actionError(error)
  revalidatePath('/archive')
  revalidatePath('/orders')
  revalidatePath('/orders/archive')
  revalidateDashboard()
  return {}
}

export async function markOrderAsSeen(orderId: string) {
  const auth = await getCurrentUserRole()
  if ('error' in auth) return { error: auth.error }

  await markOrderNotificationsRead(orderId)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  revalidateDashboard()
  return { success: true }
}
