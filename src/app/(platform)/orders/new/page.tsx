import { createClient } from '@/lib/supabase/server'
import { NewOrderClient } from './new-order-client'
import type { Customer, Product } from '@/types'

import { platformMeta } from '@/lib/metadata'

export const metadata = platformMeta.newSale

export default async function NewOrderPage() {
  const supabase = await createClient()
  const [customersResult, productsResult] = await Promise.all([
    supabase.from('customers').select('id, name, discount_group:discount_groups(discount_rate)').is('deleted_at', null).order('name'),
    supabase.from('products').select('id, name, ref, unit_price, currency').is('deleted_at', null).eq('is_active', true).order('name'),
  ])
  return (
    <NewOrderClient
      customers={((customersResult.data ?? []) as any[]).map((c) => ({
        ...c,
        discount_rate: c.discount_group?.discount_rate ?? 0,
      }))}
      products={(productsResult.data as Product[]) ?? []}
    />
  )
}
