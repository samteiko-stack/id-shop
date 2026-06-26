import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeInvoiceSettlement, type InvoiceSettlement } from '@/lib/invoice-settlement'

export {
  attachLotNumbersByOrderItemId,
  attachLotNumbersFromOrder,
  attachLotNumbersToItems,
  formatLotNumbersFromBatches,
  lotNumbersByOrderItemId,
  lotNumbersByProductId,
} from '@/lib/trace/lot-display'

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
