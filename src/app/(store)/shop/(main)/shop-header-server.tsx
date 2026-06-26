import { ShopHeader } from './shop-header'
import { SessionTimeoutGuard } from '@/components/auth/session-timeout-guard'
import { getCachedFooterCategories } from '@/lib/storefront/cached-queries'
import { getStorefrontAuthContext } from '@/lib/storefront/auth-context'

export async function ShopHeaderServer() {
  const [auth, categoryGroups] = await Promise.all([
    getStorefrontAuthContext(),
    getCachedFooterCategories(),
  ])

  const topCategories = categoryGroups.map(({ id, name, slug }) => ({ id, name, slug }))

  let cartCount = 0
  if (auth?.customer?.is_approved) {
    const { data: draftOrder } = await auth.supabase
      .from('orders')
      .select('id, order_items(id)')
      .eq('customer_id', auth.customer.id)
      .eq('status', 'draft')
      .eq('source', 'storefront')
      .is('deleted_at', null)
      .maybeSingle()
    cartCount = draftOrder?.order_items?.length ?? 0
  }

  const isCustomer = auth?.role === 'customer' && !!auth.customer

  return (
    <>
      {isCustomer ? <SessionTimeoutGuard redirectTo="/shop/login" /> : null}
      <ShopHeader
        customer={
          isCustomer && auth
            ? {
                id: auth.user.id,
                email: auth.user.email ?? '',
                name: auth.customer!.name,
                isApproved: auth.customer!.is_approved,
              }
            : null
        }
        showAdminLink={!!auth && auth.role !== 'customer'}
        cartCount={cartCount}
        topCategories={topCategories}
      />
    </>
  )
}

export function ShopHeaderFallback() {
  return <div className="h-[var(--storefront-header-height,4.5rem)] border-b border-border bg-background" />
}
