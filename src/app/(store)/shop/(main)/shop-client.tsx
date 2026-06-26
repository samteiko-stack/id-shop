'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Lock, X, Package, ArrowRight } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Button, ButtonLink } from '@/components/ui/button'
import { AddToCartControls } from '@/components/shop/add-to-cart-controls'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { CategoryStrip, type CategoryStripItem } from '@/components/shop/category-strip'
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

interface Category {
  id: string
  name: string
}

interface MainCategory {
  id: string
  name: string
  slug: string
  image_url: string | null
}

interface Props {
  products: Product[]
  mainCategories: MainCategory[]
  categories: Category[]
  isLoggedIn: boolean
  isApproved: boolean
  customerId: string | null
  discountRate?: number
  shopBanner?: StorefrontShopBanner
}

export function ShopClient({ products, mainCategories, categories, isLoggedIn, isApproved, discountRate = 0, shopBanner }: Props) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get('category') ?? null)

  useEffect(() => {
    const cat = searchParams.get('category')
    const q = searchParams.get('q')
    if (cat !== undefined) setSelectedCategory(cat)
    if (q !== undefined) setSearch(q ?? '')
  }, [searchParams])

  const PAGE_SIZE = 24
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase()
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(q) ||
        p.ref.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q))
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [search, selectedCategory])

  const visible = filtered.slice(0, visibleCount)

  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.name

  const categoryStripItems = useMemo(
    (): CategoryStripItem[] =>
      mainCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: cat.image_url,
      })),
    [mainCategories]
  )

  return (
    <>
      <StorefrontPageHero
        eyebrow="Sortiment"
        title={activeCategoryName ?? 'Alla produkter'}
        description="Certifierade medicinska och dentala produkter för kliniker. Bläddra, sök och beställ online."
      >
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Sök på namn eller REF…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 pr-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-white/20"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </StorefrontPageHero>

      <StorefrontContainer pageSpacing>
      {shopBanner && (
        <div className="mb-8 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {shopBanner === 'login' ? (
            <>
              <Link href="/shop/login" className="text-primary font-medium hover:underline">
                Logga in som företag
              </Link>{' '}
              för att se priser och lägga beställningar.
            </>
          ) : (
            'Ditt konto väntar på godkännande. Du kan bläddra men kan inte beställa ännu.'
          )}
        </div>
      )}

      {categoryStripItems.length > 0 && (
        <CategoryStrip categories={categoryStripItems} className="mb-10" />
      )}

      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'produkt' : 'produkter'}
          {search && <> för &ldquo;{search}&rdquo;</>}
        </p>
      </div>

      <div className="flex gap-10 items-start">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Kategorier
          </p>
          <nav className="space-y-0.5 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
            <Button
              variant={!selectedCategory ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(null)}
              className="w-full justify-between text-sm font-medium"
            >
              <span>Alla produkter</span>
              <span className="text-xs tabular-nums opacity-70">{products.length}</span>
            </Button>
            {categories.map(cat => {
              const count = products.filter(p => p.category_id === cat.id).length
              if (count === 0) return null
              const active = selectedCategory === cat.id
              return (
                <Button
                  key={cat.id}
                  variant={active ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(active ? null : cat.id)}
                  className="w-full justify-between text-sm font-medium"
                >
                  <span className="truncate text-left">{cat.name}</span>
                  <span className="text-xs tabular-nums opacity-70 shrink-0 ml-2">{count}</span>
                </Button>
              )
            })}
          </nav>
        </aside>

        {/* Product area */}
        <div className="flex-1 min-w-0">
          {/* Mobile category dropdown */}
          <div className="lg:hidden mb-5">
            <select
              value={selectedCategory ?? ''}
              onChange={e => setSelectedCategory(e.target.value || null)}
              className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
            >
              <option value="">Alla produkter ({products.length})</option>
              {categories.map(cat => {
                const count = products.filter(p => p.category_id === cat.id).length
                if (count === 0) return null
                return (
                  <option key={cat.id} value={cat.id}>{cat.name} ({count})</option>
                )
              })}
            </select>
          </div>

          {/* Count row — fixed height to prevent layout shift */}
          <div className="flex items-center justify-between mb-5 h-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span>
              {' '}produkt{filtered.length !== 1 ? 'er' : ''}
              {search && <> för <span className="italic">"{search}"</span></>}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => { setSearch(''); setSelectedCategory(null) }}
              className="text-xs h-auto p-0 transition-opacity"
              disabled={!search && !selectedCategory}
              style={{ opacity: search || selectedCategory ? 1 : 0, pointerEvents: search || selectedCategory ? 'auto' : 'none' }}
            >
              Rensa filter
            </Button>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">Inga produkter hittades</p>
              <p className="text-xs text-muted-foreground mt-1">Prova att justera din sökning eller ditt filter</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {visible.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isLoggedIn={isLoggedIn}
                    isApproved={isApproved}
                    discountRate={discountRate}
                  />
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="flex flex-col items-center gap-2 mt-10">
                  <p className="text-xs text-muted-foreground">
                    Visar {visible.length} av {filtered.length} produkter
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  >
                    Ladda fler
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StorefrontContainer>
    </>
  )
}

function ProductCard({
  product,
  isLoggedIn,
  isApproved,
  discountRate,
}: {
  product: Product
  isLoggedIn: boolean
  isApproved: boolean
  discountRate: number
}) {
  const displayPrice = applyGeneralDiscount(Number(product.unit_price), discountRate)
  return (
    <div className="bg-card border border-border rounded-lg flex flex-col group hover:border-primary/40 transition-colors duration-200 overflow-hidden">
      {/* Image — links to product page */}
      <Link href={`/shop/products/${product.id}`} className="block">
        <div className="aspect-[4/3] bg-muted overflow-hidden relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
          {product.categories && (
            <div className="absolute top-2 left-2">
                <span className="bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border border-border rounded">
                {product.categories.name}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <Link href={`/shop/products/${product.id}`} className="group/title">
            <h3 className="font-semibold text-sm text-foreground leading-snug mb-1 group-hover/title:text-primary transition-colors">{product.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground font-mono">REF {product.ref}</p>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price + CTA */}
        <div className="pt-3 border-t border-border space-y-3">
          {isLoggedIn ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground tabular-nums">
                {displayPrice.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{product.currency}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
                <Link href="/shop/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Logga in som företag
              </Link>
            </div>
          )}

          {isLoggedIn && isApproved && (
            <AddToCartControls productId={product.id} productName={product.name} />
          )}

          {isLoggedIn && !isApproved && (
            <p className="text-xs text-muted-foreground text-center py-0.5">Väntar på godkännande</p>
          )}

          {!isLoggedIn && (
            <ButtonLink href="/shop/login" variant="outline" className="w-full">
              Logga in som företag
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  )
}
