'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Package, Lock, ShoppingCart, ArrowLeft } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/button'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { toast } from '@/lib/toast'
import { addToCart } from '../../../actions'
import { showAddedToCartToast } from '@/lib/storefront/cart-toast'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { applyGeneralDiscount } from '@/lib/discounts'
import type { StorefrontShopBanner } from '@/lib/storefront/auth-context'

interface Product {
  id: string
  name: string
  ref: string
  description: string | null
  unit_price: number
  currency: string
  image_url: string | null
  category_id: string | null
  categories: { id: string; name: string } | null
}

interface Props {
  product: Product
  related: Product[]
  isLoggedIn: boolean
  isApproved: boolean
  customerId: string | null
  discountRate?: number
  shopBanner?: StorefrontShopBanner
}

export function ShopProductClient({ product, related, isLoggedIn, isApproved, discountRate = 0, shopBanner }: Props) {
  const displayPrice = applyGeneralDiscount(Number(product.unit_price), discountRate)
  const [qty, setQty] = useState(1)
  const [adding, startTransition] = useTransition()
  const router = useRouter()

  function handleAddToCart() {
    if (!isLoggedIn) { router.push('/shop/login'); return }
    if (!isApproved) { toast.error('Ditt konto väntar på godkännande.'); return }
    startTransition(async () => {
      const result = await addToCart(product.id, qty)
      if ('error' in result) toast.error(result.error)
      else {
        showAddedToCartToast(product.name, qty)
        router.refresh()
      }
    })
  }

  return (
    <StorefrontContainer pageSpacing>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link href="/shop" className="hover:text-foreground transition-colors">Sortiment</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        {product.categories ? (
          <>
            <Link
              href={`/shop?category=${product.categories.id}`}
              className="hover:text-foreground transition-colors"
            >
              {product.categories.name}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </>
        ) : null}
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20">
        {/* Image */}
        <div className="aspect-square bg-muted overflow-hidden border border-border rounded-lg">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Package className="h-16 w-16 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">Ingen bild tillgänglig</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.categories && (
            <Link
              href={`/shop?category=${product.categories.id}`}
              className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 hover:underline w-fit"
            >
              {product.categories.name}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-foreground leading-tight mb-2">
            {product.name}
          </h1>

          <p className="text-sm text-muted-foreground font-mono mb-6">REF {product.ref}</p>

          {/* Price */}
          <div className="mb-6 pb-6 border-b border-border">
            {isLoggedIn ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {displayPrice.toFixed(2)}
                </span>
                <span className="text-base text-muted-foreground">{product.currency}</span>
                <span className="text-sm text-muted-foreground ml-1">exkl. moms</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  <Link href="/shop/login" className="text-primary font-medium hover:underline">
                    Logga in som företag
                  </Link>{' '}
                  för att se pris
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-foreground mb-2">Beskrivning</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* CTA */}
          {isLoggedIn && isApproved && (
            <div className="flex gap-2 mt-auto items-stretch">
              <QuantityStepper value={qty} onChange={setQty} disabled={adding} />
              <Button
                className="min-w-0 flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={adding}
              >
                <ShoppingCart className="h-4 w-4" />
                {adding ? 'Lägger till…' : 'Lägg i varukorg'}
              </Button>
            </div>
          )}

          {isLoggedIn && !isApproved && shopBanner === 'pending' && (
            <div className="mt-auto border border-border bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
              Ditt konto väntar på godkännande. Du kan bläddra men kan inte beställa ännu.
            </div>
          )}

          {shopBanner === 'login' && (
            <div className="mt-auto">
              <ButtonLink href="/shop/login" variant="outline" className="w-full gap-2">
                <Lock className="h-4 w-4" />
                Logga in som företag
              </ButtonLink>
            </div>
          )}

          {/* Product meta */}
          <div className="mt-8 pt-6 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide w-16">REF</span>
              <span className="font-mono text-foreground">{product.ref}</span>
            </div>
            {product.categories && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide w-16">Kategori</span>
                <span className="text-foreground">{product.categories.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="border-t border-border pt-12">
          <h2 className="text-lg font-bold text-foreground mb-6">Mer från {product.categories?.name ?? 'denna kategori'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.map(p => (
              <Link
                key={p.id}
                href={`/shop/products/${p.id}`}
                className="group border border-border bg-card rounded-lg hover:border-primary/40 transition-colors flex flex-col overflow-hidden"
              >
                <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">REF {p.ref}</p>
                  {isLoggedIn && (
                    <p className="text-sm font-bold text-foreground mt-auto pt-2">
                      {applyGeneralDiscount(Number(p.unit_price), discountRate).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">{p.currency}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-border">
        <ButtonLink href="/shop" variant="ghost">
          <ArrowLeft className="h-4 w-4" />Tillbaka till sortimentet
        </ButtonLink>
      </div>
    </StorefrontContainer>
  )
}
