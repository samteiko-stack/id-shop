import { formatCurrency, formatDate } from '@/lib/utils'

type FacingItem = {
  id: string
  quantity: number
  net_unit_price: number
  net_line_total: number
  lot_numbers?: string
  product?: { name?: string; ref?: string } | null
}

type OrderPrintDocumentProps = {
  order: Record<string, unknown> & {
    order_number: string
    status?: string
    created_at: string
    due_date?: string | null
    notes?: string | null
    customer?: {
      name?: string
      email?: string
      phone?: string
      address?: string
      org_number?: string
      contact_person?: string
    } | null
    items?: unknown[]
  }
  invoice?: { invoice_number?: string } | null
  facingItems: FacingItem[]
  netSubtotal: number
  extraDiscountRate: number
  extraDiscountAmount: number
  tax: number
  shipping: number
  grandTotal: number
  paid: number
  balance: number
}

export function OrderPrintDocument({
  order: o,
  invoice,
  facingItems,
  netSubtotal,
  extraDiscountRate,
  extraDiscountAmount,
  tax,
  shipping,
  grandTotal,
  paid,
  balance,
}: OrderPrintDocumentProps) {
  return (
    <article className="print-document mx-auto w-full max-w-3xl px-8 py-10 print:max-w-none print:px-0 print:py-0">
      <header className="print-document-header flex items-start justify-between border-b pb-4 print:pb-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DENTAL SHOP</h1>
          <p className="mt-1 text-sm text-muted-foreground">Professional Dental Supplies</p>
        </div>
        <div className="flex items-start gap-3 print:hidden">
          <div className="flex h-12 w-28 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
            Barcode
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
            QR
          </div>
        </div>
      </header>

      <section className="print-document-meta mt-6 grid grid-cols-2 gap-8 print:mt-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</p>
          <p className="font-semibold">{o.customer?.name}</p>
          {o.customer?.address && <p className="text-sm text-muted-foreground">{o.customer.address}</p>}
          {o.customer?.org_number && <p className="text-sm text-muted-foreground">Org: {o.customer.org_number}</p>}
          {o.customer?.contact_person && (
            <p className="text-sm text-muted-foreground">Contact: {o.customer.contact_person}</p>
          )}
          {o.customer?.email && <p className="text-sm text-muted-foreground">{o.customer.email}</p>}
          {o.customer?.phone && <p className="text-sm text-muted-foreground">{o.customer.phone}</p>}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</p>
          <p className="font-semibold">ID SHOP</p>
          <p className="text-sm text-muted-foreground">Professional Dental Solutions</p>
          <p className="text-sm text-muted-foreground">contact@idshop.se</p>

          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Date:</dt>
              <dd className="font-medium">{formatDate(o.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Reference No:</dt>
              <dd className="font-medium">{o.order_number}</dd>
            </div>
            {o.status && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Sale Status:</dt>
                <dd className="font-medium capitalize">{o.status}</dd>
              </div>
            )}
            {invoice?.invoice_number && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Invoice No:</dt>
                <dd className="font-medium">{invoice.invoice_number}</dd>
              </div>
            )}
            {o.due_date && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Due Date:</dt>
                <dd className="font-medium">{formatDate(o.due_date)}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="print-document-table-wrap mt-6 overflow-hidden rounded-lg border print:mt-4 print:overflow-visible print:rounded-none print:border-0">
        <table className="print-document-table w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="w-10 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Code / Description</th>
              <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Lot No.</th>
              <th className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Qty</th>
              <th className="w-28 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Unit Price</th>
              <th className="w-28 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {facingItems.map((item, idx) => (
              <tr key={item.id} className="print-document-row">
                <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">REF: {item.product?.ref}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.lot_numbers || '—'}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.net_unit_price)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.net_line_total)}</td>
              </tr>
            ))}
            {facingItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="print-document-summary mt-6 flex justify-end print:mt-4">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(netSubtotal)}</span>
          </div>
          {extraDiscountRate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extra discount ({extraDiscountRate}%):</span>
              <span className="font-medium text-red-600">−{formatCurrency(extraDiscountAmount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
          )}
          {shipping > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">{formatCurrency(shipping)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total Amount:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span className="font-medium">Paid:</span>
            <span className="font-semibold">{formatCurrency(paid)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-amber-600">
            <span>Balance:</span>
            <span>{formatCurrency(balance)}</span>
          </div>
        </div>
      </section>

      {o.notes && (
        <section className="print-document-notes mt-6 border-t pt-4 print:mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="text-sm">{o.notes}</p>
        </section>
      )}

      <footer className="print-document-footer mt-6 border-t pt-4 text-center text-xs text-muted-foreground print:mt-4">
        <p>Created by ID SHOP • {formatDate(o.created_at)}</p>
      </footer>
    </article>
  )
}
