import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { platformMeta } from '@/lib/metadata'
import { salePrintTitle } from '@/lib/sale-print'
import { getOrderForPrint } from '@/lib/orders/print-data'
import { OrderPrintDocument } from '@/components/orders/order-print-document'
import { PrintPageUnlock } from '@/components/orders/print-page-unlock'
import { ButtonLink } from '@/components/ui/button'
import { ArrowLeft } from '@/components/icons'
import { PrintButton } from './print-button'
import { PrintDocumentTitle } from './print-document-title'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<Metadata> {
  const { id } = await searchParams
  if (!id) return platformMeta.printSale('Sale')

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, customer:customers(name)')
    .eq('id', id)
    .single()

  if (!order) return platformMeta.printSale('Sale')

  const customerName = (order.customer as { name?: string })?.name
  return {
    title: { absolute: salePrintTitle(order.order_number, customerName) },
    description: platformMeta.printSale(order.order_number, customerName).description,
  }
}

export default async function OrderPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  if (!id) redirect('/orders')

  const supabase = await createClient()
  const data = await getOrderForPrint(supabase, id)
  if (!data) notFound()

  const documentTitle = salePrintTitle(data.order.order_number, data.order.customer?.name)

  return (
    <div className="print-page min-h-full bg-background">
      <PrintPageUnlock />
      <PrintDocumentTitle title={documentTitle} />

      <div className="print:hidden border-b bg-muted/50 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <ButtonLink href={`/orders/${id}`} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to order
          </ButtonLink>
          <PrintButton documentTitle={documentTitle} />
        </div>
      </div>

      <OrderPrintDocument {...data} />
    </div>
  )
}
