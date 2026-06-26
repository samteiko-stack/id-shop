'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ProductSelect } from '@/components/products/product-select'
import { formatCurrency } from '@/lib/utils'
import { computeOrderTotals } from '@/lib/discounts'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, Loader2 } from '@/components/icons'
import { updateOrder } from '../../actions'

interface LineItem {
  id?: string
  product_id: string
  quantity: number
  unit_price: number
}

interface Props {
  order: any
  customers: { id: string; name: string; discount_rate?: number }[]
  products: { id: string; name: string; ref: string; unit_price: number }[]
}

export function EditOrderClient({ order, customers, products }: Props) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState(order.customer_id ?? '')
  const [notes, setNotes] = useState(order.notes ?? '')
  const [extraDiscountRate, setExtraDiscountRate] = useState(String(order.extra_discount_rate ?? 0))
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<LineItem[]>(
    order.items?.length
      ? order.items.map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))
      : [{ product_id: '', quantity: 1, unit_price: 0 }]
  )

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const groupDiscountRate = selectedCustomer?.discount_rate ?? 0

  const totals = useMemo(
    () =>
      computeOrderTotals({
        items,
        discount_rate: groupDiscountRate,
        extra_discount_rate: parseFloat(extraDiscountRate) || 0,
      }),
    [items, groupDiscountRate, extraDiscountRate],
  )

  function addItem() {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items]
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      updated[index] = { ...updated[index], product_id: value as string, unit_price: product?.unit_price ?? updated[index].unit_price }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setItems(updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { toast.error('Please select a customer'); return }
    const validItems = items.filter((i) => i.product_id && i.quantity > 0)
    if (validItems.length === 0) { toast.error('Add at least one product'); return }

    startTransition(async () => {
      const result = await updateOrder(order.id, {
        customer_id: customerId,
        notes: notes || null,
        items: validItems,
        extra_discount_rate: parseFloat(extraDiscountRate) || 0,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Order updated')
      router.push(`/orders/${order.id}`)
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <ButtonLink href={`/orders/${order.id}`} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />Back to {order.order_number}
        </ButtonLink>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Edit {order.order_number}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <SearchableSelect
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select a customer"
                searchPlaceholder="Search customers…"
                disabled={isPending}
                className="h-10"
              />
            </div>
            {customerId && (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Customer discount group: </span>
                <span className="font-medium">{groupDiscountRate}%</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied to line prices on customer documents. Set via the customer&apos;s discount group.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="extra-discount">Extra discount (%)</Label>
              <Input
                id="extra-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={extraDiscountRate}
                onChange={(e) => setExtraDiscountRate(e.target.value)}
                disabled={isPending}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Shown on bill of sale and invoice when set.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={isPending}
                placeholder="Optional order notes…"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Products</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={isPending}>
                <Plus className="h-3.5 w-3.5" />Add product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Product</Label>
                  <ProductSelect
                    products={products}
                    value={item.product_id}
                    onValueChange={(value) => updateItem(index, 'product_id', value)}
                    disabled={isPending}
                    className="h-10"
                  />
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    disabled={isPending}
                  />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label className="text-xs">List price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    disabled={isPending}
                  />
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Total</Label>
                  <p className="h-10 flex items-center text-sm font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1 || isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex justify-end pt-3 border-t">
              <div className="space-y-1 text-right text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">List subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.listSubtotal)}</span>
                </div>
                {totals.generalDiscountAmount > 0 && (
                  <div className="flex justify-between gap-8 text-[var(--success-600)]">
                    <span>Customer discount ({totals.discountRate}%)</span>
                    <span>−{formatCurrency(totals.generalDiscountAmount)}</span>
                  </div>
                )}
                {totals.extraDiscountAmount > 0 && (
                  <div className="flex justify-between gap-8 text-[var(--success-600)]">
                    <span>Extra discount ({totals.extraDiscountRate}%)</span>
                    <span>−{formatCurrency(totals.extraDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 border-t pt-2">
                  <span className="font-medium">Customer total</span>
                  <span className="text-lg font-bold">{formatCurrency(totals.taxableSubtotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <ButtonLink href={`/orders/${order.id}`} variant="outline">Cancel</ButtonLink>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
