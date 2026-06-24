import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiscountGroupDetailClient } from './discount-group-detail-client'

export default async function DiscountGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: group } = await supabase
    .from('discount_groups')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  
  if (!group) notFound()
  
  // Get customers using this discount group
  const { data: customers, count } = await supabase
    .from('customers')
    .select('id, name, email', { count: 'exact' })
    .eq('discount_group_id', id)
    .is('deleted_at', null)
    .order('name')
  
  return (
    <DiscountGroupDetailClient
      group={group}
      customers={customers ?? []}
      customerCount={count ?? 0}
    />
  )
}
