'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, Phone, MapPin, Globe, Hash, User, Percent, Clock,
  Package, FileText, Pencil, Loader2, ChevronRight,
} from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { getStatusStyles } from '@/lib/status-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { storefrontStatusLabel } from '@/lib/storefront/account-types'
import type { AccountCustomer, AccountInvoiceRow, AccountOrderRow } from '@/lib/storefront/account-types'
import type { CustomerProfileInput } from '@/lib/validators'
import { updateCustomerProfile } from './actions'
import { ReorderOrderButton } from '@/components/shop/reorder-order-button'
import { toast } from 'sonner'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  )
}

function StorefrontStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
      getStatusStyles(status),
    )}>
      {storefrontStatusLabel(status)}
    </span>
  )
}

export function AccountClient({
  customer,
  orders,
  invoices,
  initialTab,
}: {
  customer: AccountCustomer
  orders: AccountOrderRow[]
  invoices: AccountInvoiceRow[]
  initialTab: 'profil' | 'bestallningar' | 'fakturor'
}) {
  const router = useRouter()
  const [tab, setTab] = useState(initialTab)
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CustomerProfileInput>({
    name: customer.name,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    tax_id: customer.tax_id ?? '',
    org_number: customer.org_number ?? '',
    contact_person: customer.contact_person ?? '',
    website: customer.website ?? '',
  })

  function handleTabChange(value: string) {
    const next = value as typeof initialTab
    setTab(next)
    router.replace(`/shop/konto?tab=${next}`, { scroll: false })
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateCustomerProfile(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Uppgifterna har sparats')
      setEditOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <StorefrontPageHero
        eyebrow="Mitt konto"
        title={customer.name}
        description="Se beställningar, fakturor och uppdatera företagsuppgifter."
      />

      <StorefrontContainer pageSpacing className="space-y-6">
        {!customer.is_approved && (
          <Alert variant="warning">
            <AlertIcon variant="warning"><Clock /></AlertIcon>
            <p className="font-medium">
              Ditt konto väntar på godkännande. Du kan uppdatera uppgifter här, men beställning online blir tillgänglig när kontot är godkänt.
            </p>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid h-auto min-h-12 w-full max-w-xl grid-cols-3 p-1.5 group-data-horizontal/tabs:h-auto">
            <TabsTrigger value="profil" className="h-auto min-h-10 py-2.5">
              Profil
            </TabsTrigger>
            <TabsTrigger value="bestallningar" className="h-auto min-h-10 py-2.5">
              Beställningar ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="fakturor" className="h-auto min-h-10 py-2.5">
              Fakturor ({invoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Redigera uppgifter
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">Företagsuppgifter</CardTitle>
                    <StorefrontStatusBadge status={customer.is_approved ? 'approved' : 'pending'} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Registrerad {formatDate(customer.created_at)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <InfoRow icon={Hash} label="Organisationsnummer" value={customer.org_number} />
                    <InfoRow icon={FileText} label="Momsregistreringsnummer" value={customer.tax_id} />
                    <InfoRow icon={Globe} label="Webbplats" value={customer.website} />
                    <InfoRow icon={MapPin} label="Adress" value={customer.address} />
                    {customer.discount_group && (
                      <div className="flex items-start gap-3">
                        <Percent className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Rabattgrupp</p>
                          <p className="text-sm font-medium text-foreground">
                            {customer.discount_group.name} ({customer.discount_group.discount_rate}%)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kontaktperson</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow icon={User} label="Namn" value={customer.contact_person} />
                  <InfoRow icon={Mail} label="E-post" value={customer.email} />
                  <InfoRow icon={Phone} label="Telefon" value={customer.phone} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bestallningar">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Beställningar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground">Inga beställningar ännu.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[var(--table-row-hover)] transition-colors"
                      >
                        <Link
                          href={`/shop/konto/bestallningar/${order.id}`}
                          className="flex min-w-0 flex-1 items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-medium text-foreground">
                              {formatCurrency(order.total, order.currency)}
                            </span>
                            <StorefrontStatusBadge status={order.status} />
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                        <ReorderOrderButton
                          orderId={order.id}
                          sourceOrderNumber={order.order_number}
                          variant="outline"
                          size="sm"
                          className="hidden sm:inline-flex"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fakturor">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fakturor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {invoices.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground">Inga fakturor ännu.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/shop/konto/fakturor/${invoice.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[var(--table-row-hover)] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {invoice.issue_date ? formatDate(invoice.issue_date) : '—'}
                            {invoice.due_date ? ` · Förfaller ${formatDate(invoice.due_date)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                          {invoice.status === 'cancelled' ? (
                            <StorefrontStatusBadge status="cancelled" />
                          ) : (
                            <StorefrontStatusBadge status={invoice.payment_status} />
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </StorefrontContainer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Redigera uppgifter</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-5 pt-1">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Företag</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Företagsnamn *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Organisationsnummer</Label>
                    <Input
                      value={form.org_number ?? ''}
                      onChange={(e) => setForm({ ...form, org_number: e.target.value })}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Momsregistreringsnummer</Label>
                    <Input
                      value={form.tax_id ?? ''}
                      onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adress</Label>
                  <Input
                    value={form.address ?? ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webbplats</Label>
                  <Input
                    value={form.website ?? ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kontakt</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Kontaktperson</Label>
                  <Input
                    value={form.contact_person ?? ''}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>E-post</Label>
                    <Input
                      type="email"
                      value={form.email ?? ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={form.phone ?? ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Spara'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
