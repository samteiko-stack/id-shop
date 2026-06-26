import { shopMeta } from '@/lib/metadata'
import { computeOrderTotals } from '@/lib/discounts'
import { computeInvoiceSettlement } from '@/lib/invoice-settlement'
import { requireStorefrontCustomerOrRedirect } from '@/lib/storefront/customer-session'
import type { AccountCustomer, AccountInvoiceRow, AccountOrderRow } from '@/lib/storefront/account-types'
import { AccountClient } from './account-client'

export const metadata = shopMeta.account

function mapCustomer(raw: Record<string, unknown>): AccountCustomer {
  const discountGroup = raw.discount_group as { name: string; discount_rate: number } | { name: string; discount_rate: number }[] | null
  return {
    id: raw.id as string,
    name: raw.name as string,
    email: (raw.email as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    address: (raw.address as string | null) ?? null,
    tax_id: (raw.tax_id as string | null) ?? null,
    org_number: (raw.org_number as string | null) ?? null,
    contact_person: (raw.contact_person as string | null) ?? null,
    website: (raw.website as string | null) ?? null,
    is_approved: Boolean(raw.is_approved),
    created_at: raw.created_at as string,
    discount_group: Array.isArray(discountGroup) ? discountGroup[0] ?? null : discountGroup,
  }
}

export default async function CustomerAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await requireStorefrontCustomerOrRedirect('/shop/konto')

  const { supabase, customer } = session
  const { tab } = await searchParams
  const initialTab = tab === 'bestallningar' || tab === 'fakturor' ? tab : 'profil'

  const [customerResult, ordersResult, invoicesResult] = await Promise.all([
    supabase
      .from('customers')
      .select('*, discount_group:discount_groups(name, discount_rate)')
      .eq('id', customer.id)
      .single(),
    supabase
      .from('orders')
      .select(`
        id, order_number, status, created_at,
        discount_rate, discount_amount, extra_discount_rate, extra_discount_amount,
        order_items(quantity, unit_price)
      `)
      .eq('customer_id', customer.id)
      .is('deleted_at', null)
      .neq('status', 'draft')
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, currency, issue_date, due_date, payments(amount)')
      .eq('customer_id', customer.id)
      .is('deleted_at', null)
      .order('issue_date', { ascending: false }),
  ])

  const profile = mapCustomer((customerResult.data ?? customer) as Record<string, unknown>)

  const orders: AccountOrderRow[] = (ordersResult.data ?? []).map((order: Record<string, unknown>) => {
    const items = (order.order_items as Array<{ quantity: number; unit_price: number }>) ?? []
    const totals = computeOrderTotals({
      items,
      discount_rate: Number(order.discount_rate ?? 0),
      extra_discount_rate: Number(order.extra_discount_rate ?? 0),
    })
    return {
      id: order.id as string,
      order_number: order.order_number as string,
      status: order.status as string,
      created_at: order.created_at as string,
      total: totals.taxableSubtotal,
      currency: 'SEK',
    }
  })

  const invoiceIds = (invoicesResult.data ?? []).map((inv: { id: string }) => inv.id)
  let creditsByInvoice: Record<string, number> = {}

  if (invoiceIds.length > 0) {
    const { data: credits } = await supabase
      .from('credit_invoices')
      .select('invoice_id, total')
      .in('invoice_id', invoiceIds)

    creditsByInvoice = (credits ?? []).reduce((acc, credit) => {
      acc[credit.invoice_id] = (acc[credit.invoice_id] ?? 0) + Number(credit.total)
      return acc
    }, {} as Record<string, number>)
  }

  const invoices: AccountInvoiceRow[] = (invoicesResult.data ?? []).map((inv: Record<string, unknown>) => {
    const paid = ((inv.payments as Array<{ amount: number }>) ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    )
    const credited = creditsByInvoice[inv.id as string] ?? 0
    const settlement = computeInvoiceSettlement(Number(inv.total), paid, credited)

    return {
      id: inv.id as string,
      invoice_number: inv.invoice_number as string,
      status: inv.status as string,
      payment_status: inv.status === 'cancelled' ? 'cancelled' : settlement.status,
      total: Number(inv.total),
      currency: (inv.currency as string) ?? 'SEK',
      issue_date: (inv.issue_date as string | null) ?? null,
      due_date: (inv.due_date as string | null) ?? null,
      balance_due: settlement.balanceDue,
    }
  })

  return (
    <AccountClient
      customer={profile}
      orders={orders}
      invoices={invoices}
      initialTab={initialTab}
    />
  )
}
