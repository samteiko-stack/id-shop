'use server'

import { createClient } from '@/lib/supabase/server'
import { productBatchSchema } from '@/lib/validators'
import { writeAuditLog } from '@/lib/audit'
import { requireWriteAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'
import { sanitizePostgrestSearch } from '@/lib/supabase/sanitize-search'

export async function assignBatchToOrderItem(input: {
  product_id: string
  order_item_id: string
  ref: string
  lot_number: string
  expiry_date: string
  raw_qr_payload: string
  quantity: number
}) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const parsed = productBatchSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()

  const { product_id, order_item_id, ref, lot_number, expiry_date, raw_qr_payload, quantity } = parsed.data

  // Create or find existing batch with same LOT + product
  let batchId: string

  const { data: existingBatch } = await supabase
    .from('product_batches')
    .select('id')
    .eq('product_id', product_id)
    .eq('lot_number', lot_number)
    .eq('ref', ref)
    .maybeSingle()

  if (existingBatch) {
    batchId = existingBatch.id
  } else {
    const { data: newBatch, error: batchError } = await supabase
      .from('product_batches')
      .insert({
        product_id,
        ref,
        lot_number,
        expiry_date,
        raw_qr_payload,
        scanned_by: auth.userId,
      })
      .select('id')
      .single()

    if (batchError) return { error: batchError.message }
    batchId = newBatch.id
  }

  // Link batch to order item
  const { error: linkError } = await supabase.from('order_item_batches').insert({
    order_item_id,
    batch_id: batchId,
    quantity,
  })

  if (linkError) return { error: linkError.message }

  await writeAuditLog({
    tableName: 'order_item_batches',
    recordId: batchId,
    action: 'INSERT',
    newData: { order_item_id, batch_id: batchId, quantity, lot_number, ref },
  })

  revalidateDashboard()

  return { data: { batchId } }
}

export async function searchTraceability(query: string) {
  const auth = await requireWriteAccess()
  if ('error' in auth) return { error: auth.error }

  const q = sanitizePostgrestSearch(query)
  if (!q) return { data: [] }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_batches')
    .select(`
      id, ref, lot_number, expiry_date, scanned_at, raw_qr_payload,
      product:products(id, name, ref),
      order_item_batches(
        quantity,
        order_item:order_items(
          id, quantity, unit_price,
          order:orders(
            id, order_number, created_at,
            customer:customers(id, name, email, phone)
          ),
          product:products(name, ref)
        )
      )
    `)
    .or(`lot_number.ilike.%${q}%,ref.ilike.%${q}%`)
    .order('scanned_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}
