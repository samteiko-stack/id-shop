import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { platformMeta } from '@/lib/metadata'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { resolveOrderInvoices } from '@/lib/order-invoices'
import { OrderDetailClient } from './order-detail-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, customer:customers(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!order) return platformMeta.sales
  const customerName = (order.customer as { name?: string } | null)?.name
  return platformMeta.saleDetail(order.order_number, customerName)
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        product:products(id, name, ref, unit_price, currency),
        batches:order_item_batches(
          *,
          batch:product_batches(*)
        )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!order) notFound()

  const invoices = await resolveOrderInvoices(supabase, {
    id: order.id,
    customer_id: order.customer_id,
    created_at: order.created_at,
    discount_amount: (order as any).discount_amount,
    items: (order.items ?? []).map((item: { quantity: number; unit_price: number }) => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  })

  const invoiceIds = invoices.map((inv) => inv.id)
  const { data: credits } = invoiceIds.length > 0
    ? await supabase
        .from('credit_invoices')
        .select('id, credit_number, invoice_id, total, created_at')
        .in('invoice_id', invoiceIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const creditRows = credits ?? []

  const creditsByInvoice = creditRows.reduce((acc, credit) => {
    if (!acc[credit.invoice_id]) acc[credit.invoice_id] = []
    acc[credit.invoice_id].push(credit)
    return acc
  }, {} as Record<string, typeof creditRows>)

  const linkedInvoices = invoices.map((inv) => {
    const paid = (inv.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const invoiceCredits = creditsByInvoice[inv.id] ?? []
    const creditTotal = invoiceCredits.reduce((sum, c) => sum + Number(c.total), 0)
    const settlement = computeInvoiceSettlement(Number(inv.total), paid, creditTotal)
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      total: inv.total,
      currency: inv.currency,
      status: inv.status,
      issue_date: inv.issue_date,
      created_at: inv.created_at,
      settlement,
      credits: invoiceCredits,
    }
  })

  return <OrderDetailClient order={order as any} linkedInvoices={linkedInvoices} />
}
