import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeInvoiceSettlement, type InvoiceSettlement } from '@/lib/invoice-settlement'

const DEFAULT_LOGO = path.join(process.cwd(), 'public', 'logo-blue.png')
export const SUPPLIER_LOGO = path.join(process.cwd(), 'public', 'logo-jdental-care.png')

export interface InvoiceCompanySettings {
  name: string
  address: string
  org_number: string
  vat_number: string
  phone: string
  email: string
  bankgiro: string
  payment_terms_days?: number
  logo_src?: string
  f_skatt?: boolean
}

export function buildSwedishCompany(raw: Record<string, unknown> | null | undefined): InvoiceCompanySettings {
  const s = raw ?? {}
  return {
    name: String(s.name ?? 'ID Shop'),
    address: String(s.address ?? ''),
    org_number: String(s.org_number ?? s.tax_id ?? ''),
    vat_number: String(
      s.vat_number ?? (s.tax_id ? `SE${String(s.tax_id).replace(/\D/g, '')}01` : ''),
    ),
    phone: String(s.phone ?? ''),
    email: String(s.email ?? ''),
    bankgiro: String(s.bankgiro ?? ''),
    payment_terms_days: s.payment_terms_days ? Number(s.payment_terms_days) : 30,
    logo_src: resolveLogoSrc(s.logo_url as string | undefined),
    f_skatt: s.f_skatt !== false,
  }
}

function resolveLogoSrc(logoUrl?: string | null): string {
  if (logoUrl && logoUrl.trim()) return logoUrl.trim()
  return DEFAULT_LOGO
}

export function paymentStatusLabel(status: InvoiceSettlement['status']): string {
  switch (status) {
    case 'paid':
      return 'Betald'
    case 'partial':
      return 'Delvis betald'
    case 'credited':
      return 'Krediterad'
    case 'refund_due':
      return 'Återbetalning'
    default:
      return 'Obetald'
  }
}

type OrderItemWithBatches = {
  id?: string
  product_id: string | null
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

export function formatLineDescription(item: {
  description: string
  product?: { ref?: string | null; name?: string | null } | null
}): string {
  const ref = item.product?.ref?.trim()
  const name = item.description?.trim() || item.product?.name?.trim() || 'Artikel'
  if (ref) return `${ref} - ${name}`
  return name
}

export async function fetchInvoiceSettlement(
  supabase: SupabaseClient,
  invoiceId: string,
  total: number,
): Promise<InvoiceSettlement> {
  const [{ data: payments }, { data: credits }] = await Promise.all([
    supabase.from('payments').select('amount').eq('invoice_id', invoiceId).is('deleted_at', null),
    supabase.from('credit_invoices').select('total').eq('invoice_id', invoiceId),
  ])

  const paid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const credited = (credits ?? []).reduce((sum, c) => sum + Number(c.total), 0)

  return computeInvoiceSettlement(total, paid, credited)
}

export const INVOICE_PDF_SELECT = `
  *,
  customer:customers(*),
  items:invoice_items(*, product:products(name, ref)),
  order:orders(
    order_number,
    items:order_items(
      id,
      product_id,
      batches:order_item_batches(
        quantity,
        batch:product_batches(lot_number, expiry_date)
      )
    )
  )
`
