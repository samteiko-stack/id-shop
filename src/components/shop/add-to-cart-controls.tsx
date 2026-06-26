'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/app/(store)/shop/actions'
import { toast } from '@/lib/toast'
import { showAddedToCartToast } from '@/lib/storefront/cart-toast'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { cn } from '@/lib/utils'

interface Props {
  productId: string
  productName: string
  disabled?: boolean
  className?: string
}

export function AddToCartControls({ productId, productName, disabled = false, className = '' }: Props) {
  const [qty, setQty] = useState(1)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    startTransition(async () => {
      const res = await addToCart(productId, qty)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      showAddedToCartToast(productName, qty)
      setQty(1)
      router.refresh()
    })
  }

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <QuantityStepper
        value={qty}
        onChange={setQty}
        disabled={disabled || isPending}
      />
      <Button
        onClick={handleAdd}
        disabled={disabled || isPending}
        className="flex-1 gap-1.5 px-2.5 sm:px-3"
      >
        <ShoppingCart className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{isPending ? 'Lägger till…' : 'Lägg i varukorg'}</span>
      </Button>
    </div>
  )
}
