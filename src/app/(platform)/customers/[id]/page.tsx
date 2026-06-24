import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Button, ButtonLink } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin, FileText, Globe, Hash, User, Clock, Pencil, Percent } from '@/components/icons'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { StatusBadge } from '@/components/ui/status-badge'
import { ApproveButton } from './approve-button'
import { EditCustomerDialog } from './edit-customer-dialog'

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
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

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [customerResult, ordersResult, invoicesResult, discountGroupsResult] = await Promise.all([
    supabase.from('customers').select('*, discount_group:discount_groups(id, name, discount_rate)').eq('id', id).is('deleted_at', null).single(),
    supabase.from('orders').select('id, order_number, status, created_at').eq('customer_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, status, total, currency, issue_date').eq('customer_id', id).is('deleted_at', null).order('issue_date', { ascending: false }),
    supabase.from('discount_groups').select('id, name, discount_rate').is('deleted_at', null).eq('is_active', true).order('name'),
  ])

  if (!customerResult.data) notFound()

  const customer = customerResult.data
  const orders = ordersResult.data ?? []
  const invoices = invoicesResult.data ?? []
  const discountGroups = discountGroupsResult.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ButtonLink href="/customers" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />Back to Customers
        </ButtonLink>
        <div className="flex items-center gap-2">
          <EditCustomerDialog customer={customer} discountGroups={discountGroups} />
          {!customer.is_approved && (
            <ApproveButton customerId={customer.id} />
          )}
        </div>
      </div>

      {!customer.is_approved && (
        <Alert variant="warning">
          <AlertIcon variant="warning"><Clock /></AlertIcon>
          <p className="font-medium">This account is pending approval. Review the company details below before approving.</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company info */}
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">Company Details</CardTitle>
                <StatusBadge status={customer.is_approved ? 'approved' : 'pending'} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-bold text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Registered {formatDate(customer.created_at)}</p>
              </div>
              <div className="space-y-3">
                <InfoRow icon={Hash}      label="Organization Number" value={customer.org_number} />
                <InfoRow icon={FileText}  label="Tax ID / VAT"  value={customer.tax_id} />
                <InfoRow icon={Globe}     label="Website"             value={customer.website} />
                <InfoRow icon={MapPin}    label="Address"                value={customer.address} />
                {(customer as any).discount_group && (
                  <div className="flex items-start gap-3">
                    <Percent className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Discount Group</p>
                      <p className="text-sm font-medium text-foreground">
                        {(customer as any).discount_group.name} ({(customer as any).discount_group.discount_rate}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Person</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User}  label="Name"    value={customer.contact_person} />
              <InfoRow icon={Mail}  label="Email"  value={customer.email} />
              <InfoRow icon={Phone} label="Phone" value={customer.phone} />
            </CardContent>
          </Card>

          {customer.notes && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Orders */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Orders ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((o: any) => (
                    <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--table-row-hover)] transition-colors">
                      <span className="text-sm font-medium text-foreground">{o.order_number}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />Invoices ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {invoices.map((inv: any) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--table-row-hover)] transition-colors">
                      <span className="text-sm font-medium text-foreground">{inv.invoice_number}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">{formatCurrency(inv.total, inv.currency)}</span>
                        <span className="text-xs text-muted-foreground">{inv.issue_date ? formatDate(inv.issue_date) : '—'}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
