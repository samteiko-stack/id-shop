import { toast } from '@/lib/toast'

export function showAddedToCartToast(productName: string, quantity = 1) {
  const message =
    quantity > 1
      ? `${quantity}× ${productName} har lagts till i varukorgen`
      : `${productName} har lagts till i varukorgen`

  toast.success(message)
}
