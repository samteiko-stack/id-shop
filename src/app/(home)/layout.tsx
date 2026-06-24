import { ShopHeader } from '@/app/(store)/shop/(main)/shop-header'
import { ShopFooter } from '@/app/(store)/shop/(main)/shop-footer'
import { getFooterCategoryGroups } from '@/lib/storefront/footer-categories'
import { StorefrontToaster } from '@/components/layout/storefront-toaster'
import { getStorefrontAuthContext } from '@/lib/storefront/auth-context'
import { createClient } from '@/lib/supabase/server'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [auth, categoryGroups] = await Promise.all([
    getStorefrontAuthContext(),
    getFooterCategoryGroups(supabase),
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
      .maybeSingle()
    cartCount = draftOrder?.order_items?.length ?? 0
  }

  const isCustomer = auth?.role === 'customer' && !!auth.customer

  return (
    <div className="min-h-dvh bg-background flex flex-col">
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
      <main className="flex-1 w-full min-h-0">
        {children}
      </main>
      <ShopFooter categoryGroups={categoryGroups} />
      <StorefrontToaster />
    </div>
  )
}
