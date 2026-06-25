'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/ui/filter-select'
import { ProductSelect } from '@/components/products/product-select'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import {
  Printer,
  Mail,
  FileText,
  Edit3,
  Trash2,
  Package,
  CreditCard,
  X,
  Plus,
  ScanLine,
  Search,
} from '@/components/icons'
import { toast } from 'sonner'
import type { Order, Customer, Product, OrderStatus } from '@/types'
import { useRole } from '@/hooks/use-role'
import { updateOrder, archiveOrder } from '../actions'

interface SaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
  mode?: 'view' | 'edit'
}

interface OrderWithDetails extends Order {
  customer: Customer
  items: Array<{
    id: string
    order_id: string
    product_id: string
    quantity: number
    unit_price: number
    created_at: string
    discount?: number
    serial_no?: string
    product?: Product
  }>
  total?: number
  paid_amount?: number
  balance?: number
  payment_status?: string
  order_tax?: number
  order_discount?: number
  shipping?: number
  sale_note?: string
  staff_note?: string
  payment_term?: number
  due_date?: string
  warehouse?: string
}

export function SaleModal({ open, onOpenChange, orderId, mode: initialMode = 'view' }: SaleModalProps) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Edit form state
  const [formData, setFormData] = useState({
    date: '',
    reference_no: '',
    warehouse: '',
    customer_id: '',
    status: 'draft' as OrderStatus,
    order_tax: 0,
    order_discount: 0,
    shipping: 0,
    payment_term: 0,
    sale_note: '',
    staff_note: '',
  })

  const [editItems, setEditItems] = useState<Array<{
    id?: string
    product_id: string
    serial_no: string
    unit_price: number
    quantity: number
    discount: number
  }>>([])

  // Fetch order data
  useEffect(() => {
    if (open && orderId) {
      fetchOrderData()
    }
  }, [open, orderId])

  async function fetchOrderData() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .is('deleted_at', null)
        .single()

      if (error) throw error

      const orderData = data as any
      
      // Calculate totals
      const subtotal = orderData.items?.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unit_price,
        0
      ) ?? 0
      
      const orderTax = orderData.order_tax ?? 0
      const orderDiscount = orderData.order_discount ?? 0
      const shipping = orderData.shipping ?? 0
      const total = subtotal + orderTax - orderDiscount + shipping
      const paidAmount = orderData.paid_amount ?? 0
      const balance = total - paidAmount

      setOrder({
        ...orderData,
        total,
        paid_amount: paidAmount,
        balance,
        order_tax: orderTax,
        order_discount: orderDiscount,
        shipping,
      })

      // Set form data for edit mode
      setFormData({
        date: orderData.created_at?.split('T')[0] || '',
        reference_no: orderData.order_number || '',
        warehouse: orderData.warehouse || '',
        customer_id: orderData.customer_id || '',
        status: orderData.status || 'draft',
        order_tax: orderTax,
        order_discount: orderDiscount,
        shipping,
        payment_term: orderData.payment_term || 0,
        sale_note: orderData.sale_note || '',
        staff_note: orderData.staff_note || '',
      })

      setEditItems(
        orderData.items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          serial_no: item.serial_no || '',
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount: item.discount || 0,
        })) || []
      )
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  // Fetch customers and products for edit mode
  useEffect(() => {
    if (mode === 'edit') {
      fetchCustomersAndProducts()
    }
  }, [mode])

  async function fetchCustomersAndProducts() {
    const supabase = createClient()
    const [customersRes, productsRes] = await Promise.all([
      supabase.from('customers').select('*').is('deleted_at', null),
      supabase.from('products').select('*').is('deleted_at', null).eq('is_active', true),
    ])

    if (customersRes.data) setCustomers(customersRes.data)
    if (productsRes.data) setProducts(productsRes.data)
  }

  function handlePrint() {
    window.print()
  }

  function handleEdit() {
    setMode('edit')
  }

  function handleCancelEdit() {
    setMode('view')
    fetchOrderData() // Reset form data
  }

  function handleArchive() {
    if (!confirm('Archive this sale? You can restore it from Sales → Archive.')) return

    startTransition(async () => {
      const result = await archiveOrder(orderId!)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Sale archived')
      onOpenChange(false)
      router.refresh()
    })
  }

  function handleAddItem() {
    setEditItems([
      ...editItems,
      {
        product_id: '',
        serial_no: '',
        unit_price: 0,
        quantity: 1,
        discount: 0,
      },
    ])
  }

  function handleRemoveItem(index: number) {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  function handleItemChange(index: number, field: string, value: any) {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill unit price when product is selected
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      if (product) {
        newItems[index].unit_price = product.unit_price
      }
    }

    setEditItems(newItems)
  }

  async function handleSubmit() {
    if (!orderId || !order) return

    startTransition(async () => {
      const result = await updateOrder(orderId, {
        customer_id: formData.customer_id,
        notes: formData.sale_note || null,
        extra_discount_rate: 0,
        items: editItems
          .filter((item) => item.product_id)
          .map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
      })

      if ('error' in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Sale updated successfully')
      setMode('view')
      fetchOrderData()
      router.refresh()
    })
  }

  function handlePayment() {
    toast.info('Payment dialog coming soon')
  }

  function handleDelivery() {
    toast.info('Delivery tracking coming soon')
  }

  function handleEmail() {
    toast.info('Email invoice coming soon')
  }

  function handlePDF() {
    toast.info('PDF generation coming soon')
  }

  if (!open || !orderId) return null

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!order) return null

  // Calculate totals
  const itemsSubtotal = editItems.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price - item.discount),
    0
  )
  const totalQuantity = editItems.reduce((sum, item) => sum + item.quantity, 0)
  const grandTotal = itemsSubtotal + formData.order_tax - formData.order_discount + formData.shipping

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="print:max-w-full print:h-auto print:max-h-none print:overflow-visible">
        {mode === 'view' ? (
          // VIEW MODE - Printable Invoice Layout
          <div className="space-y-6" id="printable-invoice">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">DENTAL SHOP</h1>
                <p className="text-sm text-muted-foreground mt-1">Professional Dental Supplies</p>
              </div>
              <div className="text-right">
                <div className="flex gap-4 items-start">
                  {/* Placeholder for barcode */}
                  <div className="w-24 h-12 bg-muted border rounded flex items-center justify-center text-xs text-muted-foreground">
                    Barcode
                  </div>
                  {/* Placeholder for QR code */}
                  <div className="w-12 h-12 bg-muted border rounded flex items-center justify-center text-xs text-muted-foreground">
                    QR
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">To</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{order.customer?.name}</p>
                  {order.customer?.email && (
                    <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">From</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">ID SHOP</p>
                  <p className="text-sm text-muted-foreground">Professional Dental Supplies</p>
                  <p className="text-sm text-muted-foreground">contact@idshop.se</p>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reference No:</span>
                    <span className="font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <StatusBadge status={order.payment_status || 'unpaid'} type="payment" />
                  </div>
                  {order.due_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">{formatDate(order.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Code / Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">REF: {item.product?.ref}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total (SEK):</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      order.items?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) ?? 0
                    )}
                  </span>
                </div>
                {(order.order_tax ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Tax:</span>
                    <span className="font-semibold">{formatCurrency(order.order_tax ?? 0)}</span>
                  </div>
                )}
                {(order.order_discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Discount:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(order.order_discount ?? 0)}</span>
                  </div>
                )}
                {(order.shipping ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-semibold">{formatCurrency(order.shipping ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(order.total ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 font-medium">Paid:</span>
                  <span className="text-emerald-600 font-semibold">{formatCurrency(order.paid_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span className="text-amber-600">Balance:</span>
                  <span className="text-amber-600">{formatCurrency(order.balance ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Notes</h3>
                <p className="text-sm text-foreground">{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-center text-xs text-muted-foreground">
              <p>Created by ID SHOP • {formatDateTime(order.created_at)}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 border-t pt-4 no-print">
              <div className="flex items-center gap-2">
                <Button onClick={handlePayment} size="sm" variant="default">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </Button>
                <Button onClick={handleDelivery} size="sm" variant="default">
                  <Package className="h-4 w-4" />
                  Delivery
                </Button>
                <Button onClick={handleEmail} size="sm" variant="default">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button onClick={handlePDF} size="sm" variant="default">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {canWrite && !['fulfilled', 'cancelled'].includes(order.status) && (
                  <Button onClick={handleEdit} size="sm" variant="secondary">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {canWrite && (
                  <Button onClick={handleArchive} size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // EDIT MODE
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Edit Sale - {order.order_number}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reference No</label>
                  <Input value={formData.reference_no} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Biller</label>
                  <Input value="DENTAL SHOP" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Warehouse</label>
                  <Input
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    placeholder="Enter warehouse"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-2">
                  Customer
                  <Search className="h-4 w-4 text-muted-foreground" />
                </label>
                <FilterSelect
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </FilterSelect>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Products</h3>
                  <Button onClick={handleAddItem} size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                          Serial No
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                          Net Unit Price
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                          Discount
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                          Subtotal
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {editItems.map((item, index) => {
                        const subtotal = item.quantity * item.unit_price - item.discount
                        return (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <ProductSelect
                                products={products}
                                value={item.product_id}
                                onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                                className="w-full min-w-[220px]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={item.serial_no}
                                onChange={(e) => handleItemChange(index, 'serial_no', e.target.value)}
                                className="w-full min-w-[120px]"
                                placeholder="Serial"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                                }
                                className="w-full min-w-[100px] text-right"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                                }
                                className="w-full min-w-[80px] text-right"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) =>
                                  handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)
                                }
                                className="w-full min-w-[80px] text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-medium">
                              {formatCurrency(subtotal)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                onClick={() => handleRemoveItem(index)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                      {editItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No products added. Click "Add Product" to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="bg-muted/30 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium">Order Items ({totalQuantity} items)</span>
                <span className="text-base font-bold">{formatCurrency(itemsSubtotal)}</span>
              </div>

              {/* Tax, Discount, Shipping */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Order Tax</label>
                  <FilterSelect
                    value={formData.order_tax.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, order_tax: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full"
                  >
                    <option value="0">No Tax</option>
                    <option value={itemsSubtotal * 0.12}>VAT 12%</option>
                    <option value={itemsSubtotal * 0.25}>VAT 25%</option>
                  </FilterSelect>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Order Discount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.order_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, order_discount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Shipping</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping}
                    onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Sale Status and Payment Term */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Sale Status</label>
                  {['fulfilled', 'cancelled'].includes(order.status) ? (
                    <div className="flex h-10 items-center">
                      <StatusBadge status={order.status} />
                    </div>
                  ) : (
                    <FilterSelect
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                      className="w-full"
                    >
                      <option value="draft">Draft</option>
                      <option value="confirmed">Confirmed</option>
                    </FilterSelect>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Term (days)</label>
                  <Input
                    type="number"
                    value={formData.payment_term}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_term: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Sale Note</label>
                <textarea
                  value={formData.sale_note}
                  onChange={(e) => setFormData({ ...formData, sale_note: e.target.value })}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add sale note..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Staff Note</label>
                <textarea
                  value={formData.staff_note}
                  onChange={(e) => setFormData({ ...formData, staff_note: e.target.value })}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add staff note (internal only)..."
                />
              </div>

              {/* Grand Total Bar */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <span>
                      <span className="text-muted-foreground">Items:</span>{' '}
                      <span className="font-semibold">{totalQuantity}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Total:</span>{' '}
                      <span className="font-semibold">{formatCurrency(itemsSubtotal)}</span>
                    </span>
                    {formData.order_discount > 0 && (
                      <span>
                        <span className="text-muted-foreground">Discount:</span>{' '}
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(formData.order_discount)}
                        </span>
                      </span>
                    )}
                    {formData.order_tax > 0 && (
                      <span>
                        <span className="text-muted-foreground">Tax:</span>{' '}
                        <span className="font-semibold">{formatCurrency(formData.order_tax)}</span>
                      </span>
                    )}
                    {formData.shipping > 0 && (
                      <span>
                        <span className="text-muted-foreground">Shipping:</span>{' '}
                        <span className="font-semibold">{formatCurrency(formData.shipping)}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-3">Grand Total:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <Button onClick={handleCancelEdit} variant="outline" disabled={isPending}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
