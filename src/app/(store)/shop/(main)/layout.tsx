import { Suspense } from 'react'
import { StorefrontToaster } from '@/components/layout/storefront-toaster'
import { ShopFooterServer } from './shop-footer-server'
import { ShopHeaderFallback, ShopHeaderServer } from './shop-header-server'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Suspense fallback={<ShopHeaderFallback />}>
        <ShopHeaderServer />
      </Suspense>
      <main className="flex-1 w-full min-h-0">
        {children}
      </main>
      <Suspense fallback={null}>
        <ShopFooterServer />
      </Suspense>
      <StorefrontToaster />
    </div>
  )
}
