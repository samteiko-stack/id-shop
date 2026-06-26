'use server'

import { revalidatePath } from 'next/cache'
import { customerProfileSchema, type CustomerProfileInput } from '@/lib/validators'
import { requireStorefrontCustomer } from '@/lib/storefront/customer-session'

export async function updateCustomerProfile(input: CustomerProfileInput) {
  const session = await requireStorefrontCustomer()
  if ('error' in session) return { error: session.error }

  const parsed = customerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter' }
  }

  const { supabase, customer } = session
  const { error } = await supabase
    .from('customers')
    .update({
      ...parsed.data,
      email: parsed.data.email || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customer.id)
    .eq('auth_user_id', session.user.id)

  if (error) return { error: error.message }

  revalidatePath('/shop/konto')
  return { success: true }
}
