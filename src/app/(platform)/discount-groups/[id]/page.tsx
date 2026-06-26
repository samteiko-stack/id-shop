import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { platformMeta } from '@/lib/metadata'
import { DiscountGroupDetailClient } from './discount-group-detail-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: group } = await supabase
    .from('discount_groups')
    .select('name')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!group) return platformMeta.discountGroups
  return platformMeta.discountGroupDetail(group.name)
}

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
