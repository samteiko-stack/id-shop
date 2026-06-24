import { createClient } from '@/lib/supabase/server'
import { CreditInvoicesClient } from './credit-invoices-client'

export const metadata = { title: 'Credit Invoices' }

const DEFAULT_PAGE_SIZE = 10

export default async function CreditInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page     = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = [10, 25, 50, 100].includes(parseInt(pageSizeParam ?? '')) ? parseInt(pageSizeParam!) : DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const supabase = await createClient()

  const { data: credits, count } = await supabase
    .from('credit_invoices')
    .select('*, customer:customers(name), invoice:invoices(invoice_number)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <CreditInvoicesClient
      credits={(credits as any[]) ?? []}
      pagination={{ page, totalPages, totalCount, pageSize: pageSize }}
    />
  )
}
