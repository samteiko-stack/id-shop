'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import NextImage from 'next/image'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { ReorderOrderButton } from '@/components/shop/reorder-order-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatusStyles } from '@/lib/status-config'
import { storefrontStatusLabel } from '@/lib/storefront/account-types'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  product: { name: string; ref: string; image_url: string | null } | null
}

export function CustomerOrderDetailClient({
  order,
}: {
  order: {
    id: string
    order_number: string
    status: string
    created_at: string
    currency: string
    notes: string | null
    items: OrderItem[]
    subtotal: number
    discount_amount: number
    extra_discount_amount: number
    total: number
  }
}) {
  return (
    <>
      <StorefrontPageHero
        eyebrow="Beställning"
        title={order.order_number}
        backLink={{ href: '/shop/konto?tab=bestallningar', label: 'Tillbaka till beställningar' }}
        lead={
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              getStatusStyles(order.status),
            )}>
              {storefrontStatusLabel(order.status)}
            </span>
            <span className="text-sm text-white/70">{formatDateTime(order.created_at)}</span>
          </div>
        }
      />

      <StorefrontContainer pageSpacing className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Orderrader</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {item.product?.image_url ? (
                      <NextImage src={item.product.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.product?.name ?? 'Produkt'}</p>
                    {item.product?.ref && (
                      <p className="text-xs text-muted-foreground mt-0.5">Ref: {item.product.ref}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.quantity * item.unit_price, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delsumma</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rabatt</span>
                <span>-{formatCurrency(order.discount_amount, order.currency)}</span>
              </div>
            )}
            {order.extra_discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extrarabatt</span>
                <span>-{formatCurrency(order.extra_discount_amount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Totalt</span>
              <span>{formatCurrency(order.total, order.currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Beställ samma produkter igen</p>
              <p className="text-xs text-muted-foreground mt-1">
                Läggs i varukorgen så du kan granska och ändra innan du skickar.
              </p>
            </div>
            <ReorderOrderButton
              orderId={order.id}
              sourceOrderNumber={order.order_number}
              className="shrink-0"
            />
          </CardContent>
        </Card>

        {order.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        <Link href="/shop/konto?tab=bestallningar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Alla beställningar
        </Link>
      </StorefrontContainer>
    </>
  )
}
