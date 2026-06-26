'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRole } from '@/hooks/use-role'
import { QRScanner, type QRScanResult } from '@/components/qr/qr-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, QrCode, Package, User, AlertTriangle } from '@/components/icons'
import { Alert, AlertIcon } from '@/components/ui/alert'
import Link from 'next/link'
import { assignBatchToOrderItem, searchTraceability } from './actions'

function formatOrderLabel(order: { order_number?: string; customer?: { name?: string } | null; created_at?: string }) {
  const customer = (order.customer as { name?: string } | null)?.name ?? 'Unknown customer'
  const date = order.created_at ? formatDateTime(order.created_at) : ''
  return date ? `${order.order_number} — ${customer} (${date})` : `${order.order_number} — ${customer}`
}

interface Props {
  openOrders: any[]
  initialOrderId?: string
  initialSearch?: string
}

export function TraceabilityClient({ openOrders, initialOrderId, initialSearch = '' }: Props) {
  const { canScanQR } = useRole()
  const [activeTab, setActiveTab] = useState<string>('search')
  useEffect(() => { setActiveTab(canScanQR ? 'scan' : 'search') }, [canScanQR])
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId ?? '')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [manualLot, setManualLot] = useState('')
  const [manualExpiry, setManualExpiry] = useState('')
  const [scanMissingLot, setScanMissingLot] = useState(false)
  const [scanMissingExpiry, setScanMissingExpiry] = useState(false)
  const [confirmQuantity, setConfirmQuantity] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const selectedOrder = openOrders.find((o) => o.id === selectedOrderId)
  const selectedItem = selectedOrder?.items?.find((i: any) => i.id === selectedItemId)

  function handleScan(result: QRScanResult) {
    setScanResult(result)
    const lot = result.payload.lot_number?.trim() ?? ''
    const expiry = result.payload.expiry_date?.trim() ?? ''
    setManualLot(lot)
    setManualExpiry(expiry)
    setScanMissingLot(!lot)
    setScanMissingExpiry(!expiry)
    if (result.isValid) {
      // Auto-match REF to order items
      if (selectedOrder && result.payload.ref) {
        const matchedItem = selectedOrder.items?.find(
          (item: any) => item.product?.ref?.toLowerCase() === result.payload.ref?.toLowerCase()
        )
        if (matchedItem) {
          setSelectedItemId(matchedItem.id)
          const tracedQty = matchedItem.batches?.reduce((s: number, b: any) => s + b.quantity, 0) ?? 0
          setConfirmQuantity(Math.max(1, matchedItem.quantity - tracedQty))
        }
      }
    }
  }

  function handleAssign() {
    if (!scanResult?.isValid || !selectedItemId) return
    const lotNumber = manualLot.trim()
    if (!lotNumber) {
      toast.error('LOT number is required. Enter it manually if it was not in the scan.')
      return
    }
    if (!manualExpiry) {
      toast.error('Expiry date is required. Enter it manually or check the QR format.')
      return
    }

    startTransition(async () => {
      const result = await assignBatchToOrderItem({
        product_id: selectedItem?.product_id,
        order_item_id: selectedItemId,
        ref: scanResult.payload.ref ?? '',
        lot_number: lotNumber,
        expiry_date: manualExpiry,
        raw_qr_payload: scanResult.payload.raw,
        quantity: confirmQuantity,
      })

      if (result.error) { toast.error(result.error); return }
      toast.success(`Batch assigned: LOT ${lotNumber}`)
      setScanResult(null)
      setManualLot('')
      setManualExpiry('')
      setScanMissingLot(false)
      setScanMissingExpiry(false)
      setSelectedItemId('')
    })
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    const result = await searchTraceability(searchQuery)
    setSearchLoading(false)
    if (result.error) { toast.error(result.error); return }
    setSearchResults(result.data ?? [])
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {canScanQR && <TabsTrigger value="scan" className="gap-2"><QrCode className="h-4 w-4" />Scan & Assign</TabsTrigger>}
          <TabsTrigger value="search" className="gap-2"><Search className="h-4 w-4" />Search LOT / REF</TabsTrigger>
        </TabsList>

        {/* ── SCAN TAB ── */}
        {canScanQR && (
          <TabsContent value="scan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Select order */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                    Select Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedOrderId} onValueChange={(v) => { setSelectedOrderId(v ?? ''); setSelectedItemId('') }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a confirmed order…">
                        {selectedOrder ? formatOrderLabel(selectedOrder) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {openOrders.map((o) => (
                        <SelectItem key={o.id} value={o.id} label={formatOrderLabel(o)}>
                          <div className="flex flex-col items-start gap-0.5 py-0.5">
                            <span className="font-medium">{o.order_number}</span>
                            <span className="text-xs text-muted-foreground">
                              {(o.customer as { name?: string } | null)?.name ?? 'Unknown customer'}
                              {o.created_at ? ` · ${formatDateTime(o.created_at)}` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedOrder && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Order items</Label>
                      {selectedOrder.items?.map((item: any) => {
                        const tracedQty = item.batches?.reduce((s: number, b: any) => s + b.quantity, 0) ?? 0
                        const isFullyTraced = tracedQty >= item.quantity
                        return (
                          <Button
                            key={item.id}
                            variant="outline"
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full justify-between text-sm ${
                              selectedItemId === item.id
                                ? 'border-primary bg-primary-subtle'
                                : isFullyTraced
                                ? 'border-success/30 bg-[var(--scan-success-bg)] text-muted-foreground'
                                : 'hover:border-primary/40 hover:bg-primary-subtle'
                            }`}
                          >
                            <span className="font-medium">{item.product?.name}</span>
                            <span className={`text-xs ${isFullyTraced ? 'text-success' : tracedQty > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {tracedQty}/{item.quantity} traced
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Scan */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    Scan Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QRScanner
                    onScan={handleScan}
                    disabled={!selectedOrderId}
                    placeholder={!selectedOrderId ? 'Select an order first…' : 'Scan QR code with USB/BT scanner…'}
                  />

                  {scanResult?.isValid && selectedItemId && (
                    <div className="space-y-3 pt-2">
                      {scanMissingLot && (
                        <Alert variant="warning">
                          <AlertIcon variant="warning"><AlertTriangle /></AlertIcon>
                          <div>
                            <p className="font-medium">LOT number not found in scan</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Enter the batch/lot from the package label.</p>
                          </div>
                        </Alert>
                      )}

                      {scanMissingLot && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">LOT number *</Label>
                          <Input
                            value={manualLot}
                            placeholder="e.g. 02-41-25-2326"
                            onChange={(e) => setManualLot(e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      )}

                      {scanMissingExpiry && (
                        <Alert variant="warning">
                          <AlertIcon variant="warning"><AlertTriangle /></AlertIcon>
                          <div>
                            <p className="font-medium">Expiry date not found in QR</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Please enter it manually.</p>
                          </div>
                        </Alert>
                      )}

                      {scanMissingExpiry && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Expiry Date *</Label>
                          <Input
                            type="date"
                            value={manualExpiry}
                            onChange={(e) => setManualExpiry(e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantity to assign</Label>
                        <Input
                          type="number"
                          min="1"
                          value={confirmQuantity}
                          onChange={(e) => setConfirmQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <Button
                        onClick={handleAssign}
                        disabled={isPending || !manualLot.trim() || !manualExpiry}
                        className="w-full gap-2"
                      >
                        <Package className="h-4 w-4" />
                        Assign LOT {manualLot.trim() || '…'} to order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ── SEARCH TAB ── */}
        <TabsContent value="search" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-end gap-3 max-w-lg">
                <div className="flex-1 space-y-2">
                  <Label>Search by LOT number or REF</Label>
                  <Input
                    placeholder="e.g. LOT-XYZ123 or REF-456"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()}>
                  {searchLoading ? 'Searching…' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {searchResults.length} batch{searchResults.length !== 1 ? 'es' : ''} found
              </p>
              {searchResults.map((batch: any) => (
                <Card key={batch.id} className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-semibold text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          {batch.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">REF: {batch.ref}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] border-0 font-mono">
                          LOT: {batch.lot_number}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exp: {batch.expiry_date}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {batch.order_item_batches?.length > 0 && (
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Distributed to:
                      </p>
                      {batch.order_item_batches.map((oib: any) => (
                        <div key={oib.order_item?.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 border border-border">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {oib.order_item?.order?.customer?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {oib.order_item?.order?.customer?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <Link href={`/orders/${oib.order_item?.order?.id}`} className="text-sm font-medium text-primary hover:underline">
                                {oib.order_item?.order?.order_number}
                              </Link>
                              <p className="text-xs text-muted-foreground">{formatDate(oib.order_item?.order?.created_at)}</p>
                            </div>
                            <Badge className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0">
                              Qty: {oib.quantity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searchLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No batches found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
