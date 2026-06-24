import { createClient } from '@/lib/supabase/server'
import { DiscountGroupsClient } from './discount-groups-client'

export const metadata = {
  title: 'Discount Groups | Admin',
}

export default async function DiscountGroupsPage() {
  const supabase = await createClient()
  
  const { data: groups } = await supabase
    .from('discount_groups')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  
  return <DiscountGroupsClient groups={groups ?? []} />
}
