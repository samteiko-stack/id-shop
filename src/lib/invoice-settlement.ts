const EPS = 0.001

export type InvoiceSettlementStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'credited'
  | 'refund_due'

export interface InvoiceSettlement {
  total: number
  credited: number
  paid: number
  /** Invoice total minus credits — amount still chargeable */
  netTotal: number
  /** Amount the customer still owes */
  balanceDue: number
  /** Amount to refund when payments exceed net total after credits */
  refundDue: number
  status: InvoiceSettlementStatus
}

/** Standard invoice settlement: credits reduce what's owed; payments settle the net balance. */
export function computeInvoiceSettlement(
  total: number,
  paid: number,
  credited: number,
): InvoiceSettlement {
  const netTotal = Math.max(0, total - credited)
  const balanceDue = Math.max(0, netTotal - paid)
  const refundDue = Math.max(0, paid - netTotal)

  let status: InvoiceSettlementStatus = 'unpaid'
  if (refundDue > EPS) {
    status = 'refund_due'
  } else if (balanceDue <= EPS) {
    if (credited >= total - EPS && paid <= EPS) {
      status = 'credited'
    } else {
      status = 'paid'
    }
  } else if (paid > EPS) {
    status = 'partial'
  }

  return { total, credited, paid, netTotal, balanceDue, refundDue, status }
}
