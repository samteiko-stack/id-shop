import { createClient } from '@/lib/supabase/server'
import { CustomersClient } from './customers-client'
import { getCachedDiscountGroups } from '@/lib/platform/cached-reference-data'
import type { Customer } from '@/types'

export const metadata = { title: 'Customers' }

const DEFAULT_PAGE_SIZE = 10

export default async function CustomersPage({
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
  
  const [{ data: customers, count }, discountGroups] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email, phone, address, org_number, contact_person, website, auth_user_id, is_approved, tax_id, notes, discount_group_id, created_at, discount_group:discount_groups(id, name, discount_rate)', { count: 'exact' })
      .is('deleted_at', null)
      .order('name')
      .range(from, to),
    getCachedDiscountGroups(),
  ])

  const all         = (customers as unknown as Customer[]) ?? []
  const totalCount  = count ?? 0
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize))
  const pending     = all.filter(c => c.auth_user_id && !c.is_approved)
  const approved    = all.filter(c => !c.auth_user_id || c.is_approved)

  return (
    <CustomersClient
      initialCustomers={approved}
      pendingCustomers={pending}
      pagination={{ page, totalPages, totalCount, pageSize: pageSize }}
      discountGroups={discountGroups ?? []}
    />
  )
}
