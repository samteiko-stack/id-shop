type OrderItemWithBatches = {
  id?: string
  product_id?: string | null
  batches?: Array<{
    quantity?: number
    batch?: { lot_number?: string | null; expiry_date?: string | null } | null
  }> | null
}

export function formatLotNumbersFromBatches(
  batches?: OrderItemWithBatches['batches'],
): string {
  if (!batches?.length) return ''

  const parts = batches
    .map((entry) => {
      const lot = entry.batch?.lot_number?.trim()
      if (!lot) return null
      return entry.quantity && entry.quantity > 1 ? `${lot} (×${entry.quantity})` : lot
    })
    .filter((lot): lot is string => Boolean(lot))

  return [...new Set(parts)].join(', ')
}

export function lotNumbersByOrderItemId(orderItems: OrderItemWithBatches[]): Map<string, string> {
  const map = new Map<string, string>()

  for (const item of orderItems) {
    if (!item.id) continue
    const formatted = formatLotNumbersFromBatches(item.batches)
    if (formatted) map.set(item.id, formatted)
  }

  return map
}

export function attachLotNumbersByOrderItemId<T extends { id?: string }>(
  items: T[],
  lotMap: Map<string, string>,
): Array<T & { lot_numbers: string }> {
  return items.map((item) => ({
    ...item,
    lot_numbers: item.id ? lotMap.get(item.id) ?? '' : '',
  }))
}

export function attachLotNumbersFromOrder<T extends { product_id?: string | null }>(
  invoiceItems: T[],
  orderItems: OrderItemWithBatches[],
): Array<T & { lot_numbers: string }> {
  const lotsByProduct = new Map<string, string[]>()

  for (const item of orderItems) {
    if (!item.product_id) continue
    const formatted = formatLotNumbersFromBatches(item.batches)
    if (!formatted) continue
    const existing = lotsByProduct.get(item.product_id) ?? []
    lotsByProduct.set(item.product_id, [...existing, formatted])
  }

  const consumed = new Map<string, number>()

  return invoiceItems.map((item) => {
    if (!item.product_id) return { ...item, lot_numbers: '' }

    const index = consumed.get(item.product_id) ?? 0
    const lots = lotsByProduct.get(item.product_id) ?? []
    const lot_numbers = lots[index] ?? lots[lots.length - 1] ?? ''
    consumed.set(item.product_id, index + 1)

    return { ...item, lot_numbers }
  })
}

export function lotNumbersByProductId(orderItems: OrderItemWithBatches[]): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const item of orderItems) {
    if (!item.product_id) continue
    const lots = formatLotNumbersFromBatches(item.batches)
    if (!lots) continue

    const existing = map.get(item.product_id) ?? []
    map.set(item.product_id, [...existing, lots])
  }

  return map
}

export function attachLotNumbersToItems<T extends { product_id?: string | null }>(
  items: T[],
  lotMap: Map<string, string[]>,
): Array<T & { lot_numbers: string }> {
  const consumed = new Map<string, number>()

  return items.map((item) => {
    if (!item.product_id) return { ...item, lot_numbers: '' }

    const index = consumed.get(item.product_id) ?? 0
    const lots = lotMap.get(item.product_id) ?? []
    const lot_numbers = lots[index] ?? lots[lots.length - 1] ?? ''
    consumed.set(item.product_id, index + 1)

    return { ...item, lot_numbers }
  })
}
