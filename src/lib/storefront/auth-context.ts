import { createCookieClient } from '@/lib/supabase/server'
import { getCustomerDiscountRate } from '@/lib/storefront/customer-discount'
import type { UserRole } from '@/types'

type StorefrontCustomer = {
  id: string
  name: string
  is_approved: boolean
}

export type StorefrontAuthContext = {
  supabase: Awaited<ReturnType<typeof createCookieClient>>
  user: { id: string; email: string | undefined }
  role: UserRole
  customer: StorefrontCustomer | null
}

export async function getStorefrontAuthContext(): Promise<StorefrontAuthContext | null> {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_active === false) return null

  const role = (profile?.role ?? user.user_metadata?.role ?? 'read_only') as UserRole

  let customer: StorefrontCustomer | null = null
  if (role === 'customer') {
    const { data } = await supabase
      .from('customers')
      .select('id, name, is_approved')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    customer = data
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    role,
    customer,
  }
}

export type StorefrontShopBanner = 'login' | 'pending' | null

export type StorefrontCustomerProps = {
  isLoggedIn: boolean
  isApproved: boolean
  customerId: string | null
  discountRate: number
  shopBanner: StorefrontShopBanner
}

/** Shop customer session for catalog pages — uses database role, not auth metadata. */
export function getStorefrontCustomerProps(auth: StorefrontAuthContext | null): Omit<StorefrontCustomerProps, 'discountRate'> {
  const isShopCustomer = auth?.role === 'customer' && !!auth.customer

  let shopBanner: StorefrontShopBanner = null
  if (!auth) {
    shopBanner = 'login'
  } else if (auth.role === 'customer') {
    if (!auth.customer) {
      shopBanner = 'login'
    } else if (!auth.customer.is_approved) {
      shopBanner = 'pending'
    }
  }

  return {
    isLoggedIn: isShopCustomer,
    isApproved: auth?.customer?.is_approved ?? false,
    customerId: auth?.customer?.id ?? null,
    shopBanner,
  }
}

export async function getStorefrontCustomerPropsWithDiscount(): Promise<StorefrontCustomerProps> {
  const auth = await getStorefrontAuthContext()
  const props = getStorefrontCustomerProps(auth)
  let discountRate = 0

  if (props.isLoggedIn && auth) {
    discountRate = await getCustomerDiscountRate(auth.supabase, auth.user.id)
  }

  return { ...props, discountRate }
}
