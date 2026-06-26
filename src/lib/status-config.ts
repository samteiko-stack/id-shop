export type Status =
  // Order
  | 'draft' | 'confirmed' | 'fulfilled' | 'cancelled'
  // Invoice
  | 'issued' | 'paid' | 'overdue'
  // Payment
  | 'unpaid' | 'partial' | 'credited' | 'refund_due' | 'not_invoiced'
  // Credit invoice
  | 'applied'
  // Customer
  | 'approved' | 'pending'
  // Product
  | 'active' | 'inactive' | 'published'
  // Order source
  | 'storefront' | 'internal'

export const STATUS_CLASSES: Record<Status, string> = {
  draft:      'bg-[var(--status-draft-bg)]      text-[var(--status-draft-fg)]',
  confirmed:  'bg-[var(--status-confirmed-bg)]  text-[var(--status-confirmed-fg)]',
  fulfilled:  'bg-[var(--status-fulfilled-bg)]  text-[var(--status-fulfilled-fg)]',
  cancelled:  'bg-[var(--status-cancelled-bg)]  text-[var(--status-cancelled-fg)]',
  issued:     'bg-[var(--status-issued-bg)]     text-[var(--status-issued-fg)]',
  paid:       'bg-[var(--status-paid-bg)]       text-[var(--status-paid-fg)]',
  overdue:    'bg-[var(--status-overdue-bg)]    text-[var(--status-overdue-fg)]',
  unpaid:     'bg-[var(--status-unpaid-bg)]     text-[var(--status-unpaid-fg)]',
  partial:    'bg-[var(--status-partial-bg)]    text-[var(--status-partial-fg)]',
  credited:   'bg-[var(--status-credited-bg)]   text-[var(--status-credited-fg)]',
  refund_due: 'bg-[var(--status-refund-due-bg)] text-[var(--status-refund-due-fg)]',
  not_invoiced: 'bg-[var(--status-draft-bg)]      text-[var(--status-draft-fg)]',
  applied:    'bg-[var(--status-confirmed-bg)]  text-[var(--status-confirmed-fg)]',
  approved:   'bg-[var(--status-fulfilled-bg)]  text-[var(--status-fulfilled-fg)]',
  pending:    'bg-[var(--status-unpaid-bg)]     text-[var(--status-unpaid-fg)]',
  active:     'bg-[var(--status-fulfilled-bg)]  text-[var(--status-fulfilled-fg)]',
  inactive:   'bg-[var(--status-draft-bg)]      text-[var(--status-draft-fg)]',
  published:  'bg-[var(--status-fulfilled-bg)]  text-[var(--status-fulfilled-fg)]',
  storefront: 'bg-[var(--status-storefront-bg)] text-[var(--status-storefront-fg)]',
  internal:   'bg-[var(--status-internal-bg)]   text-[var(--status-internal-fg)]',
}

export const STATUS_LABELS: Record<Status, string> = {
  draft:      'Draft',
  confirmed:  'Confirmed',
  fulfilled:  'Fulfilled',
  cancelled:  'Cancelled',
  issued:     'Issued',
  paid:       'Paid',
  overdue:    'Overdue',
  unpaid:     'Unpaid',
  partial:    'Partially Paid',
  credited:   'Credited',
  refund_due: 'Refund Due',
  not_invoiced: 'Not Invoiced',
  applied:    'Applied',
  approved:   'Approved',
  pending:    'Pending',
  active:     'Active',
  inactive:   'Inactive',
  published:  'Published',
  storefront: 'Storefront',
  internal:   'Manual',
}

const DEFAULT_STYLE = 'bg-[var(--status-draft-bg)] text-[var(--status-draft-fg)]'

export function getStatusStyles(status: string): string {
  return status in STATUS_CLASSES ? STATUS_CLASSES[status as Status] : DEFAULT_STYLE
}

export function getStatusLabel(status: string): string {
  if (status in STATUS_LABELS) return STATUS_LABELS[status as Status]
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
