'use client'

import { useState, useMemo } from 'react'
import NextImage from 'next/image'
import { Lock, Package } from '@/components/icons'
import { FilterSelect } from '@/components/ui/filter-select'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { AddToCartControls } from '@/components/shop/add-to-cart-controls'
import { formatCurrency } from '@/lib/utils'
import { applyGeneralDiscount } from '@/lib/discounts'
import type { Product } from '@/types'
import type { StorefrontShopBanner } from '@/lib/storefront/auth-context'

interface Props {
  products: Product[]
  displayStyle: 'list' | 'grouped'
  breadcrumbs: BreadcrumbItem[]
  isApproved: boolean
  isLoggedIn: boolean
  discountRate?: number
  shopBanner?: StorefrontShopBanner
}

function ProductRow({
  product,
  isApproved,
  isLoggedIn,
  discountRate = 0,
  showImage = true,
}: {
  product: Product
  isApproved: boolean
  isLoggedIn: boolean
  discountRate?: number
  showImage?: boolean
}) {
  const displayPrice = applyGeneralDiscount(Number(product.unit_price), discountRate)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Top row on mobile: image + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showImage && (
          <div className="w-11 h-11 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {product.image_url ? (
              <NextImage src={product.image_url} alt={product.name} width={44} height={44} className="w-full h-full object-contain p-1" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">{product.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">REF: {product.ref}</span>
            {product.unit && <span>{product.unit}</span>}
          </div>
        </div>
      </div>

      {/* Bottom row on mobile: price + cart */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
        <div className="sm:w-28 sm:text-right">
          {isLoggedIn ? (
            <p className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
              {formatCurrency(displayPrice, product.currency)}
            </p>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Logga in</span>
            </div>
          )}
        </div>

        <div className="shrink-0">
          {isApproved ? (
            <AddToCartControls productId={product.id} productName={product.name} />
          ) : isLoggedIn ? (
            <p className="text-xs text-muted-foreground">Ej godkänd</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ListDisplay({ products, isApproved, isLoggedIn, discountRate = 0 }: { products: Product[]; isApproved: boolean; isLoggedIn: boolean; discountRate?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {products.map(p => (
        <ProductRow key={p.id} product={p} isApproved={isApproved} isLoggedIn={isLoggedIn} discountRate={discountRate} showImage />
      ))}
    </div>
  )
}

function getFamilyName(p: Product): string | null {
  return (p as any).family?.name ?? p.product_family ?? null
}

function GroupedDisplay({ products, isApproved, isLoggedIn, discountRate = 0 }: { products: Product[]; isApproved: boolean; isLoggedIn: boolean; discountRate?: number }) {
  const groups = useMemo(() => {
    const familyMap = new Map<string, { name: string; image: string | null; products: Product[] }>()
    const ungrouped: Product[] = []

    for (const p of products) {
      const name = getFamilyName(p)
      const image = (p as any).family?.image_url ?? null
      if (name) {
        if (!familyMap.has(name)) familyMap.set(name, { name, image, products: [] })
        familyMap.get(name)!.products.push(p)
      } else {
        ungrouped.push(p)
      }
    }

    const result: { family: string | null; image: string | null; products: Product[] }[] = []
    for (const [, group] of familyMap) {
      result.push({ family: group.name, image: group.image, products: group.products })
    }
    if (ungrouped.length > 0) result.push({ family: null, image: null, products: ungrouped })
    return result
  }, [products])

  return (
    <div className="space-y-6">
      {groups.map(({ family, image, products: groupProducts }) => (
        <div key={family ?? '__ungrouped'} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {family && (
            <div className="flex items-center gap-4 px-5 py-4 bg-muted/50 border-b border-border">
              <div className="w-16 h-16 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                {image ? (
                  <NextImage src={image} alt={family} width={64} height={64} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground/40">{family.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{family}</h3>
                <p className="text-xs text-muted-foreground">{groupProducts.length} varianter</p>
              </div>
            </div>
          )}
          {groupProducts.map(p => (
            <ProductRow key={p.id} product={p} isApproved={isApproved} isLoggedIn={isLoggedIn} discountRate={discountRate} showImage={false} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProductsDisplay({ products, displayStyle, breadcrumbs, isApproved, isLoggedIn, discountRate = 0 }: Props) {
  const [familyFilter, setFamilyFilter] = useState('all')

  const families = useMemo(() => {
    const set = new Set(products.map(p => getFamilyName(p)).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchFamily = familyFilter === 'all' || getFamilyName(p) === familyFilter
      return matchFamily
    })
  }, [products, familyFilter])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} />

      {/* Filters */}
      {families.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground shrink-0">Filtrera:</span>

          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <FilterSelect value={familyFilter} onChange={e => setFamilyFilter(e.target.value)} className="w-full sm:w-64">
              <option value="all">Alla familjer</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </FilterSelect>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto shrink-0">
            <button
              onClick={() => setFamilyFilter('all')}
              className="text-xs text-primary hover:underline disabled:opacity-0 disabled:pointer-events-none transition-opacity"
              disabled={familyFilter === 'all'}
            >
              Rensa filter
            </button>
            <span className="text-xs text-muted-foreground">{filtered.length} produkter</span>
          </div>
        </div>
      )}

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Inga produkter hittades</p>
        </div>
      ) : displayStyle === 'grouped' ? (
        <GroupedDisplay products={filtered} isApproved={isApproved} isLoggedIn={isLoggedIn} discountRate={discountRate} />
      ) : (
        <ListDisplay products={filtered} isApproved={isApproved} isLoggedIn={isLoggedIn} discountRate={discountRate} />
      )}
    </div>
  )
}
