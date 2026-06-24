import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from './invoices-client'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { parseDefaultTaxRate } from '@/lib/tax'
import type { Invoice, Customer, Order } from '@/types'

export const metadata = { title: 'Invoices' }

const DEFAULT_PAGE_SIZE = 10

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ from_order?: string; page?: string; pageSize?: string }>
}) {
  const params = await searchParams
  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const pageSize = Math.max(1, parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10))
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  const supabase = await createClient()

  const [invoicesResult, paymentsResult, customersResult, ordersResult, taxRateResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, order_id, customer_id, status, subtotal, tax_rate, tax_amount, total, currency, issue_date, due_date, sent_at, paid_at, created_at, customer:customers(id, name)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('payments')
      .select('invoice_id, amount')
      .is('deleted_at', null),
    supabase.from('customers').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('orders').select('id, order_number, customer_id, items:order_items(*, product:products(name, ref, unit_price))').eq('status', 'fulfilled').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('settings').select('value').eq('key', 'default_tax_rate').single(),
  ])

  const totalCount = invoicesResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const defaultTaxRate = parseDefaultTaxRate(taxRateResult.data?.value)

  let fromOrder = null
  if (params.from_order) {
    const orderRes = await supabase
      .from('orders')
      .select('*, customer:customers(*), items:order_items(*, product:products(*))')
      .eq('id', params.from_order)
      .single()
    fromOrder = orderRes.data
  }

  const invoiceIds = (invoicesResult.data ?? []).map((inv) => inv.id)

  const { data: credits } = invoiceIds.length > 0
    ? await supabase
        .from('credit_invoices')
        .select('id, invoice_id, credit_number, total, status')
        .in('invoice_id', invoiceIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Compute payment summary for each invoice
  const payments = paymentsResult.data ?? []
  const paymentsByInvoice = payments.reduce((acc, p) => {
    if (!acc[p.invoice_id]) acc[p.invoice_id] = 0
    acc[p.invoice_id] += Number(p.amount)
    return acc
  }, {} as Record<string, number>)

  const creditRows = credits ?? []

  const creditsByInvoice = creditRows.reduce((acc, credit) => {
    if (!acc[credit.invoice_id]) {
      acc[credit.invoice_id] = { count: 0, total: 0, credits: [] as typeof creditRows }
    }
    acc[credit.invoice_id].count += 1
    acc[credit.invoice_id].total += Number(credit.total)
    acc[credit.invoice_id].credits.push(credit)
    return acc
  }, {} as Record<string, { count: number; total: number; credits: typeof creditRows }>)

  const invoicesWithPayments = (invoicesResult.data ?? []).map((inv: any) => {
    const paid = paymentsByInvoice[inv.id] ?? 0
    const creditTotal = creditsByInvoice[inv.id]?.total ?? 0
    const creditInfo = creditsByInvoice[inv.id]
    const settlement = computeInvoiceSettlement(inv.total, paid, creditTotal)
    return {
      ...inv,
      paid_amount: paid,
      balance: settlement.balanceDue,
      refund_due: settlement.refundDue,
      payment_status: settlement.status,
      credit_count: creditInfo?.count ?? 0,
      credit_total: creditTotal,
      credits: creditInfo?.credits ?? [],
    }
  })

  return (
    <InvoicesClient
      initialInvoices={invoicesWithPayments as any}
      customers={(customersResult.data as Customer[]) ?? []}
      orders={(ordersResult.data as Order[]) ?? []}
      fromOrder={fromOrder as any}
      defaultTaxRate={defaultTaxRate}
      pagination={{ page, totalPages, totalCount, pageSize: pageSize }}
    />
  )
}
