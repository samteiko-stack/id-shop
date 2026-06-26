export const STOREFRONT_STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  confirmed: 'Bekräftad',
  fulfilled: 'Levererad',
  cancelled: 'Avbruten',
  issued: 'Utsänd',
  paid: 'Betald',
  overdue: 'Förfallen',
  unpaid: 'Obetald',
  partial: 'Delvis betald',
  credited: 'Krediterad',
  refund_due: 'Återbetalning',
  not_invoiced: 'Ej fakturerad',
  approved: 'Godkänd',
  pending: 'Väntar på godkännande',
}

export function storefrontStatusLabel(status: string): string {
  return STOREFRONT_STATUS_LABELS[status] ?? status
}

export type AccountOrderRow = {
  id: string
  order_number: string
  status: string
  created_at: string
  total: number
  currency: string
}

export type AccountInvoiceRow = {
  id: string
  invoice_number: string
  status: string
  payment_status: string
  total: number
  currency: string
  issue_date: string | null
  due_date: string | null
  balance_due: number
}

export type AccountCustomer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  org_number: string | null
  contact_person: string | null
  website: string | null
  is_approved: boolean
  created_at: string
  discount_group: { name: string; discount_rate: number } | null
}
