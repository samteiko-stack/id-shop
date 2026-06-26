import type { SupabaseClient } from '@supabase/supabase-js'

/** Resolve the logged-in customer's general discount rate (0–100). */
export async function getCustomerDiscountRate(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<number> {
  const { data: customer } = await supabase
    .from('customers')
    .select('discount_group:discount_groups(discount_rate)')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  return Number((customer?.discount_group as { discount_rate?: number } | null)?.discount_rate ?? 0)
}
