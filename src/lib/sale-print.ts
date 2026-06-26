export function salePrintTitle(orderNumber: string, customerName?: string | null) {
  const customer = customerName?.trim() || 'Customer'
  return `Sale ${orderNumber} — ${customer}`
}
