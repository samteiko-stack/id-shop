'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw } from '@/components/icons'
import { toast } from '@/lib/toast'
import { reorderOrder } from '@/app/(store)/shop/actions'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

interface Props {
  orderId: string
  sourceOrderNumber: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  className?: string
  showIcon?: boolean
}

export function ReorderOrderButton({
  orderId,
  sourceOrderNumber,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await reorderOrder(orderId)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setOpen(false)

      if (result.skippedProducts?.length) {
        toast.warning(
          `${result.itemCount} produkt(er) lades i varukorgen. ${result.skippedProducts.length} var inte tillgängliga och hoppades över.`,
        )
      } else {
        toast.success(`${result.itemCount} produkt(er) lades i varukorgen.`)
      }

      router.push('/shop/cart')
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showIcon ? (
          <RotateCcw className="h-4 w-4" />
        ) : null}
        Beställ igen
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beställ igen?</AlertDialogTitle>
            <AlertDialogDescription>
              Produkterna från {sourceOrderNumber} läggs i varukorgen till aktuella priser. Du kan
              ändra antal eller ta bort rader innan du skickar beställningen. Produkter som inte
              längre finns hoppas över. Om du redan har en varukorg ersätts den.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Avbryt</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
              {isPending ? 'Lägger till…' : 'Gå till varukorg'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
