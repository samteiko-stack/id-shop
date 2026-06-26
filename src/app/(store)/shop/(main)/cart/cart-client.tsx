'use client'

import { useState, useTransition } from 'react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/lib/toast'
import { updateCartItem, submitCart } from '../../actions'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { applyGeneralDiscount, computeOrderTotals } from '@/lib/discounts'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  products: { id: string; name: string; ref: string; image_url: string | null } | null
}

interface DraftOrder {
  id: string
  order_number: string
  order_items: OrderItem[]
}

interface Props {
  draftOrder: DraftOrder | null
  customerName: string
  discountRate?: number
  extraDiscountRate?: number
}

export function CartClient({
  draftOrder,
  customerName,
  discountRate = 0,
  extraDiscountRate = 0,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const items = draftOrder?.order_items ?? []
  const totals = computeOrderTotals({
    items: items.map((i) => ({ quantity: i.quantity, unit_price: Number(i.unit_price) })),
    discount_rate: discountRate,
    extra_discount_rate: extraDiscountRate,
  })
  const currency = 'SEK'

  function handleUpdate(itemId: string, qty: number) {
    startTransition(async () => {
      const result = await updateCartItem(itemId, qty)
      if (result.error) toast.error(result.error)
      else router.refresh()
    })
  }

  function handleConfirmedSubmit() {
    startTransition(async () => {
      const result = await submitCart()
      if (result.error) {
        toast.error(result.error)
      } else {
        setSubmittedOrderNumber(result.orderNumber ?? draftOrder?.order_number ?? '')
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div>
        <StorefrontPageHero
          eyebrow="Varukorg"
          title="Beställning skickad!"
          description={`Din beställning ${submittedOrderNumber} har tagits emot och behandlas. Vårt team återkommer till dig inom kort.`}
        />
        <StorefrontContainer pageSpacing>
          <div className="text-center py-20">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" aria-hidden />
            <p className="text-muted-foreground mb-8">Vårt team återkommer till dig inom kort.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <ButtonLink href="/shop/konto?tab=bestallningar">Visa mina beställningar</ButtonLink>
              <ButtonLink href="/shop" variant="outline">Fortsätt handla</ButtonLink>
            </div>
          </div>
        </StorefrontContainer>
      </div>
    )
  }

  if (!draftOrder || items.length === 0) {
    return (
      <div>
        <StorefrontPageHero
          eyebrow="Varukorg"
          title="Varukorg"
          description="Granska dina produkter och skicka beställningen till ID Shop."
        />
        <StorefrontContainer pageSpacing>
          <div className="text-center py-20">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" aria-hidden />
            <p className="text-muted-foreground mb-8">
              Din varukorg är tom. Lägg till produkter från sortimentet för att komma igång.
            </p>
            <ButtonLink href="/shop">Bläddra i sortimentet</ButtonLink>
          </div>
        </StorefrontContainer>
      </div>
    )
  }

  return (
    <div>
      <StorefrontPageHero
        eyebrow="Varukorg"
        title="Varukorg"
        description={customerName}
      />

      <StorefrontContainer pageSpacing>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-3 mb-8">
            {items.map((item) => {
              const unitPrice = applyGeneralDiscount(Number(item.unit_price), discountRate)
              const lineTotal = unitPrice * item.quantity
              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="relative h-16 w-16 bg-muted rounded-lg shrink-0 flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                    {item.products?.image_url ? (
                      <NextImage
                        src={item.products.image_url}
                        alt={item.products.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      'Ingen bild'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.products?.name}</p>
                    <p className="text-xs text-muted-foreground">REF: {item.products?.ref}</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {currency} {unitPrice.toFixed(2)} st
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdate(item.id, item.quantity - 1)}
                      disabled={isPending}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      disabled={isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUpdate(item.id, 0)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="text-right shrink-0 w-24">
                    <p className="font-bold text-foreground">
                      {currency} {lineTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Delsumma ({items.length} artikel{items.length !== 1 ? 'ar' : ''})
              </span>
              <span className="font-medium">
                {currency} {totals.netSubtotal.toFixed(2)}
              </span>
            </div>
            {totals.extraDiscountRate > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Extrarabatt ({totals.extraDiscountRate}%)</span>
                <span className="font-medium">
                  −{currency} {totals.extraDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-lg border-t border-border pt-3 mb-6">
              <span>Totalt</span>
              <span>
                {currency} {totals.taxableSubtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Priser exklusive moms. Slutlig faktura utfärdas av vårt team efter orderbekräftelse.
            </p>
            <Button
              className="w-full font-semibold"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
            >
              {isPending ? 'Skickar...' : 'Skicka beställning'}
            </Button>
          </div>
        </div>
      </StorefrontContainer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekräfta beställning</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Du är på väg att skicka följande beställning till ID Shop:</p>
                <ul className="text-sm text-foreground space-y-1 border border-border rounded-lg p-3 bg-muted/40">
                  {items.map((item) => {
                    const unitPrice = applyGeneralDiscount(Number(item.unit_price), discountRate)
                    const lineTotal = unitPrice * item.quantity
                    return (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span className="truncate">
                          {item.products?.name} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-medium">
                          {currency} {lineTotal.toFixed(2)}
                        </span>
                      </li>
                    )
                  })}
                  {totals.extraDiscountRate > 0 && (
                    <li className="flex justify-between text-sm">
                      <span>Extrarabatt ({totals.extraDiscountRate}%)</span>
                      <span>
                        −{currency} {totals.extraDiscountAmount.toFixed(2)}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                    <span>Totalt</span>
                    <span>
                      {currency} {totals.taxableSubtotal.toFixed(2)}
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Priser exklusive moms. Slutlig faktura utfärdas av vårt team.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} disabled={isPending}>
              {isPending ? 'Skickar...' : 'Ja, skicka beställning'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
