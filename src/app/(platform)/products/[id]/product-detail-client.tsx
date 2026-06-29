'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import type { Product, Category, ProductFamily } from '@/types'
import { useRole } from '@/hooks/use-role'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, ButtonLink } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ProductForm } from '../product-form'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { ArrowLeft, Pencil, Package, ScanLine, ShoppingCart, Loader2 } from '@/components/icons'
import { updateProduct } from '../actions'
import type { ProductInput } from '@/lib/validators'

interface Props {
  product: Product & { category: Category | null }
  categories: Category[]
  families: ProductFamily[]
  batches: any[]
  orderItems: any[]
}

export function ProductDetailClient({ product, categories, families, batches, orderItems }: Props) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<ProductInput>({
    name:            product.name,
    secondary_name:  product.secondary_name ?? null,
    description:     product.description ?? '',
    invoice_notes:   product.invoice_notes ?? null,
    slug:            product.slug ?? null,
    ref:             product.ref,
    category_id:     product.category_id,
    family_id:       product.family_id ?? null,
    unit_price:      product.unit_price,
    cost_price:      product.cost_price ?? null,
    currency:        product.currency,
    unit:            product.unit ?? null,
    weight_kg:       product.weight_kg ?? null,
    is_active:       product.is_active,
    is_featured:     product.is_featured ?? false,
    hide_in_shop:    product.hide_in_shop ?? false,
    is_promotional:  product.is_promotional ?? false,
    alert_quantity:  product.alert_quantity ?? 0,
    image_url:       product.image_url,
    product_family:  product.product_family ?? null,
    display_order:   product.display_order ?? 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setErrors({})
    startTransition(async () => {
      const r = await updateProduct(product.id, form)
      if (r.error) { toast.error(r.error); return }
      if (r.fieldErrors) { setErrors(r.fieldErrors); return }
      toast.success('Product updated')
      setEditOpen(false)
      router.refresh()
    })
  }

  const totalOrdered = orderItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ButtonLink href="/products" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />Back to Products
        </ButtonLink>
        {canWrite && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />Edit Product
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 bg-muted border border-border rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative">
          {product.image_url ? (
            <NextImage src={product.image_url} alt={product.name} fill className="object-cover" sizes="80px" />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
          </div>
          <p className="text-sm text-muted-foreground font-mono">REF {product.ref}</p>
          {product.category && <p className="text-sm text-muted-foreground mt-0.5">{product.category.name}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unit Price',      value: formatCurrency(product.unit_price, product.currency) },
          { label: 'Total Ordered',   value: `${totalOrdered} units` },
          { label: 'Batches Scanned', value: String(batches.length) },
          { label: 'Orders',          value: String(orderItems.length) },
        ].map(({ label, value }) => (
          <Card key={label} className="border-border shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product info sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">REF</p>
                <p className="font-mono text-foreground">{product.ref}</p>
              </div>
              {product.category && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Category</p>
                  <p>{product.category.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Currency</p>
                <p>{product.currency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Added</p>
                <p>{formatDate(product.created_at)}</p>
              </div>
              {product.description && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Description</p>
                  <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order history */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Order History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orderItems.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-4">No orders yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-2.5 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-b border-border">
                    <span>Order</span><span className="text-right">Customer</span><span className="text-right">Qty</span><span className="text-right">Total</span>
                  </div>
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 items-center hover:bg-[var(--table-row-hover)] transition-colors">
                      <div>
                        {item.order?.id
                          ? <Link href={`/orders/${item.order.id}`} className="text-sm font-medium text-primary hover:underline">{item.order.order_number}</Link>
                          : <span className="text-sm text-muted-foreground">—</span>}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.order?.created_at)}</p>
                      </div>
                      <span className="text-sm text-muted-foreground text-right">{item.order?.customer?.name ?? '—'}</span>
                      <span className="text-sm font-medium text-right tabular-nums">{item.quantity}</span>
                      <span className="text-sm font-medium text-right tabular-nums">{formatCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scanned batches */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Scanned Batches (Traceability)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-4">No batches scanned yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-6 py-2.5 bg-[var(--table-header-bg)] text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide border-b border-border">
                    <span>LOT</span><span>Expiry</span><span>Scanned by</span><span className="text-right">Date</span>
                  </div>
                  {batches.map((batch: any) => (
                    <div key={batch.id} className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-6 py-3 items-center">
                      <span className="text-sm font-mono font-medium text-foreground">{batch.lot_number}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{formatDate(batch.expiry_date)}</span>
                      <span className="text-sm text-muted-foreground truncate">{batch.user?.full_name ?? '—'}</span>
                      <span className="text-xs text-muted-foreground text-right">{formatDateTime(batch.scanned_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog — uses the same shared ProductForm */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="pt-1">
            <ProductForm
              form={form}
              setForm={setForm}
              categories={categories}
              families={families}
              errors={errors}
              isPending={isPending}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
