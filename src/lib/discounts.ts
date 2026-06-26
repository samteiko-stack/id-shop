export type OrderLineItem = { quantity: number; unit_price: number }

export type OrderDiscountInput = {
  items: OrderLineItem[]
  discount_rate?: number | null
  extra_discount_rate?: number | null
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function clampRate(rate: number): number {
  return Math.max(0, Math.min(100, Number(rate) || 0))
}

export function applyGeneralDiscount(unitPrice: number, discountRate: number): number {
  return roundMoney(unitPrice * (1 - clampRate(discountRate) / 100))
}

export function computeListSubtotal(items: OrderLineItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0))
}

export function computeGeneralDiscountAmount(subtotal: number, discountRate: number): number {
  return roundMoney((subtotal * clampRate(discountRate)) / 100)
}

export function computeExtraDiscountAmount(netSubtotal: number, extraDiscountRate: number): number {
  return roundMoney((netSubtotal * clampRate(extraDiscountRate)) / 100)
}

export function computeOrderTotals(input: OrderDiscountInput) {
  const discountRate = clampRate(input.discount_rate ?? 0)
  const extraDiscountRate = clampRate(input.extra_discount_rate ?? 0)
  const listSubtotal = computeListSubtotal(input.items)
  const generalDiscountAmount = computeGeneralDiscountAmount(listSubtotal, discountRate)
  const netSubtotal = roundMoney(listSubtotal - generalDiscountAmount)
  const extraDiscountAmount = computeExtraDiscountAmount(netSubtotal, extraDiscountRate)
  const taxableSubtotal = Math.max(0, roundMoney(netSubtotal - extraDiscountAmount))

  return {
    listSubtotal,
    discountRate,
    generalDiscountAmount,
    netSubtotal,
    extraDiscountRate,
    extraDiscountAmount,
    taxableSubtotal,
  }
}

export function computeTaxAndTotal(
  input: OrderDiscountInput,
  taxRate: number,
) {
  const totals = computeOrderTotals(input)
  const taxAmount = roundMoney((totals.taxableSubtotal * taxRate) / 100)
  const grandTotal = roundMoney(totals.taxableSubtotal + taxAmount)

  return {
    ...totals,
    taxRate,
    taxAmount,
    grandTotal,
  }
}

/** Line items with unit prices after general discount (for customer-facing documents). */
export function getCustomerFacingLineItems<T extends OrderLineItem>(
  items: T[],
  discountRate: number,
): Array<T & { net_unit_price: number; net_line_total: number }> {
  return items.map((item) => {
    const netUnitPrice = applyGeneralDiscount(item.unit_price, discountRate)
    return {
      ...item,
      net_unit_price: netUnitPrice,
      net_line_total: roundMoney(item.quantity * netUnitPrice),
    }
  })
}

export function getCustomerFacingSubtotal(items: OrderLineItem[], discountRate: number): number {
  return roundMoney(
    getCustomerFacingLineItems(items, discountRate).reduce((sum, item) => sum + item.net_line_total, 0),
  )
}
