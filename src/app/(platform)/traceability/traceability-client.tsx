'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, QrCode, Package, User, AlertTriangle, CheckCircle2, ChevronRight, Pencil, Trash2 } from '@/components/icons'
import { Alert, AlertIcon } from '@/components/ui/alert'
import Link from 'next/link'
import { assignBatchToOrderItem, correctTraceAssignment, removeTraceAssignment, searchTraceability } from './actions'
import { cn } from '@/lib/utils'

function formatOrderLabel(order: { order_number?: string; customer?: { name?: string } | null; created_at?: string }) {
  const customer = (order.customer as { name?: string } | null)?.name ?? 'Unknown customer'
  const date = order.created_at ? formatDateTime(order.created_at) : ''
  return date ? `${order.order_number} — ${customer} (${date})` : `${order.order_number} — ${customer}`
}

type TraceAssignment = {
  id: string
  quantity: number
  created_at?: string
  order_item_id?: string
  product_id?: string
  batch?: {
    id: string
    ref: string
    lot_number: string
    expiry_date: string
    scanned_at?: string
    raw_qr_payload?: string
  } | null
}

interface Props {
  openOrders: any[]
  initialOrderId?: string
  initialSearch?: string
}

export function TraceabilityClient({ openOrders, initialOrderId, initialSearch = '' }: Props) {
  const router = useRouter()
  const { canScanQR, canWrite } = useRole()
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
  const [selectedTrace, setSelectedTrace] = useState<TraceAssignment | null>(null)
  const [traceEditMode, setTraceEditMode] = useState(false)
  const [editLot, setEditLot] = useState('')
  const [editRef, setEditRef] = useState('')
  const [editExpiry, setEditExpiry] = useState('')
  const [editQuantity, setEditQuantity] = useState(1)
  const [removeTraceOpen, setRemoveTraceOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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
      router.refresh()
    })
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setHasSearched(true)
    const result = await searchTraceability(searchQuery)
    setSearchLoading(false)
    if (result.error) { toast.error(result.error); return }
    setSearchResults(result.data ?? [])
  }

  function openTraceDetail(
    assignment: TraceAssignment,
    context?: { order_item_id: string; product_id: string },
  ) {
    setSelectedTrace({
      ...assignment,
      order_item_id: context?.order_item_id ?? assignment.order_item_id,
      product_id: context?.product_id ?? assignment.product_id,
    })
    setTraceEditMode(false)
    setEditLot(assignment.batch?.lot_number ?? '')
    setEditRef(assignment.batch?.ref ?? '')
    setEditExpiry(assignment.batch?.expiry_date ?? '')
    setEditQuantity(assignment.quantity)
  }

  function closeTraceDetail() {
    setSelectedTrace(null)
    setTraceEditMode(false)
    setRemoveTraceOpen(false)
  }

  function handleCorrectTrace() {
    if (!selectedTrace?.order_item_id || !selectedTrace.product_id) {
      toast.error('Cannot correct this trace from here. Open it from the order item list.')
      return
    }
    const lotNumber = editLot.trim()
    if (!lotNumber || !editRef.trim() || !editExpiry) {
      toast.error('LOT, REF, and expiry are all required.')
      return
    }

    startTransition(async () => {
      const result = await correctTraceAssignment({
        assignment_id: selectedTrace.id,
        order_item_id: selectedTrace.order_item_id!,
        product_id: selectedTrace.product_id!,
        ref: editRef.trim(),
        lot_number: lotNumber,
        expiry_date: editExpiry,
        quantity: editQuantity,
      })

      if (result.error) { toast.error(result.error); return }
      toast.success(`Trace corrected to LOT ${lotNumber}`)
      closeTraceDetail()
      router.refresh()
    })
  }

  function handleRemoveTrace() {
    if (!selectedTrace) return

    startTransition(async () => {
      const result = await removeTraceAssignment(selectedTrace.id)
      if (result.error) { toast.error(result.error); return }
      toast.success('Trace assignment removed')
      closeTraceDetail()
      router.refresh()
    })
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
                    <div className="space-y-2">
                      <Label className="text-xs">Order items</Label>
                      {selectedOrder.items?.map((item: any) => {
                        const assignments: TraceAssignment[] = item.batches ?? []
                        const tracedQty = assignments.reduce((s, b) => s + b.quantity, 0)
                        const isFullyTraced = tracedQty >= item.quantity
                        const isPartiallyTraced = tracedQty > 0 && !isFullyTraced
                        const isSelected = selectedItemId === item.id

                        return (
                          <div key={item.id} className="space-y-1.5">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedItemId(item.id)}
                              className={cn(
                                'w-full h-auto py-3 flex-col items-stretch gap-2 text-sm',
                                isSelected && 'border-primary ring-2 ring-primary/20 bg-primary-subtle',
                                isFullyTraced && !isSelected && 'border-2 border-success bg-[var(--scan-success-bg)] shadow-sm',
                                isPartiallyTraced && !isSelected && 'border-2 border-warning/60 bg-[var(--status-draft-bg)]',
                              )}
                            >
                              <div className="flex w-full items-start justify-between gap-3">
                                <div className="flex items-start gap-2 text-left">
                                  {isFullyTraced && (
                                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className="font-semibold block">{item.product?.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">REF {item.product?.ref ?? '—'}</span>
                                  </div>
                                </div>
                                <Badge
                                  className={cn(
                                    'shrink-0 border-0 font-semibold',
                                    isFullyTraced
                                      ? 'bg-[var(--success-500)] text-white'
                                      : isPartiallyTraced
                                      ? 'bg-[var(--warning-500)] text-white'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {isFullyTraced ? 'TRACED' : `${tracedQty}/${item.quantity} traced`}
                                </Badge>
                              </div>
                            </Button>

                            {assignments.length > 0 && (
                              <div className="ml-1 space-y-1 border-l-2 border-success/40 pl-3">
                                {assignments.map((assignment) => (
                                  <button
                                    key={assignment.id}
                                    type="button"
                                    onClick={() => openTraceDetail(assignment, {
                                      order_item_id: item.id,
                                      product_id: item.product_id,
                                    })}
                                    className="flex w-full items-center justify-between gap-2 rounded-md border border-success/30 bg-[var(--scan-success-bg)] px-3 py-2 text-left text-xs transition-colors hover:border-success hover:bg-success/10"
                                  >
                                    <div>
                                      <p className="font-mono font-semibold text-foreground">
                                        LOT {assignment.batch?.lot_number ?? '—'}
                                      </p>
                                      <p className="text-muted-foreground">
                                        Qty {assignment.quantity}
                                        {assignment.batch?.expiry_date ? ` · Exp ${formatDate(assignment.batch.expiry_date)}` : ''}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-success" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
                    displayOverrides={{
                      lot_number: manualLot.trim() || undefined,
                      expiry_date: manualExpiry || undefined,
                    }}
                  />

                  {scanResult?.isValid && selectedItemId && (
                    <div className="space-y-3 pt-2">
                      {scanMissingLot && !manualLot.trim() && (
                        <Alert variant="warning">
                          <AlertIcon variant="warning"><AlertTriangle /></AlertIcon>
                          <div>
                            <p className="font-medium">LOT number not found in scan</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Enter the batch/lot from the package label below.</p>
                          </div>
                        </Alert>
                      )}

                      {(scanMissingLot || manualLot.trim()) && (
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

                      {scanMissingExpiry && !manualExpiry && (
                        <Alert variant="warning">
                          <AlertIcon variant="warning"><AlertTriangle /></AlertIcon>
                          <div>
                            <p className="font-medium">Expiry date not found in QR</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Please enter it manually below.</p>
                          </div>
                        </Alert>
                      )}

                      {(scanMissingExpiry || manualExpiry) && (
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
                    placeholder="e.g. 02-41-25-2326 or EV43100"
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
                          Exp: {formatDate(batch.expiry_date)}
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
                        <div key={oib.id ?? oib.order_item?.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 border border-border">
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

          {searchResults.length === 0 && hasSearched && !searchLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-1">
              <p>No batches found matching &quot;{searchQuery}&quot;</p>
              <p className="text-xs">Try with or without dashes, e.g. 0241252326 vs 02-41-25-2326</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTrace} onOpenChange={(open) => { if (!open) closeTraceDetail() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {traceEditMode ? 'Correct trace' : 'Trace record'}
            </DialogTitle>
            <DialogDescription>
              {traceEditMode
                ? 'Update the LOT, REF, expiry, or quantity. The old assignment is logged and replaced.'
                : canWrite
                ? 'Click Correct if the wrong LOT was entered. Changes are logged for audit.'
                : 'View-only trace details.'}
            </DialogDescription>
          </DialogHeader>

          {selectedTrace?.batch && (
            traceEditMode ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">LOT number *</Label>
                  <Input value={editLot} onChange={(e) => setEditLot(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">REF *</Label>
                  <Input value={editRef} onChange={(e) => setEditRef(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expiry date *</Label>
                  <Input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">LOT</dt>
                <dd className="font-mono font-semibold">{selectedTrace.batch.lot_number}</dd>

                <dt className="text-muted-foreground">REF</dt>
                <dd className="font-mono font-semibold">{selectedTrace.batch.ref}</dd>

                <dt className="text-muted-foreground">Expiry</dt>
                <dd className="font-mono">{formatDate(selectedTrace.batch.expiry_date)}</dd>

                <dt className="text-muted-foreground">Quantity</dt>
                <dd>{selectedTrace.quantity}</dd>

                {selectedTrace.batch.scanned_at && (
                  <>
                    <dt className="text-muted-foreground">Scanned</dt>
                    <dd>{formatDateTime(selectedTrace.batch.scanned_at)}</dd>
                  </>
                )}

                {selectedTrace.created_at && (
                  <>
                    <dt className="text-muted-foreground">Assigned</dt>
                    <dd>{formatDateTime(selectedTrace.created_at)}</dd>
                  </>
                )}

                {selectedTrace.batch.raw_qr_payload && (
                  <>
                    <dt className="text-muted-foreground">Raw scan</dt>
                    <dd className="font-mono text-xs break-all">{selectedTrace.batch.raw_qr_payload}</dd>
                  </>
                )}
              </dl>
            )
          )}

          {canWrite && selectedTrace?.order_item_id && selectedTrace.product_id && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {traceEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setTraceEditMode(false)} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button onClick={handleCorrectTrace} disabled={isPending || !editLot.trim() || !editExpiry}>
                    Save correction
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveTraceOpen(true)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  <Button onClick={() => setTraceEditMode(true)} disabled={isPending}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Correct LOT
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeTraceOpen}
        onOpenChange={setRemoveTraceOpen}
        title="Remove this trace?"
        description="The LOT assignment will be removed from this order line. You can scan and assign again with the correct LOT."
        confirmLabel="Remove trace"
        variant="destructive"
        onConfirm={handleRemoveTrace}
        loading={isPending}
      />
    </div>
  )
}
