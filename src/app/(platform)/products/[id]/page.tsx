import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductDetailClient } from './product-detail-client'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!product) notFound()

  const [{ data: categories }, { data: families }] = await Promise.all([
    supabase.from('categories').select('id, name, parent_id').is('deleted_at', null).order('name'),
    supabase.from('product_families').select('id, name, category_id, image_url, display_order, category:categories(id, name)').order('name'),
  ])

  // Batches scanned for this product (traceability)
  const { data: batches } = await supabase
    .from('product_batches')
    .select('id, lot_number, ref, expiry_date, scanned_at, scanned_by, raw_qr_payload, user:users(full_name)')
    .eq('product_id', id)
    .order('scanned_at', { ascending: false })
    .limit(50)

  // Order items that used this product
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, quantity, unit_price, line_total, order:orders(id, order_number, status, created_at, customer:customers(name))')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <ProductDetailClient
      product={product as any}
      categories={(categories ?? []) as any}
      families={(families ?? []) as any}
      batches={batches as any[] ?? []}
      orderItems={orderItems as any[] ?? []}
    />
  )
}
