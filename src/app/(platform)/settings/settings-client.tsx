'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Building2, FileText } from '@/components/icons'
import { saveCompanySettings, saveInvoiceSettings } from './actions'
import { DEFAULT_VAT_RATE } from '@/lib/tax'

interface Props {
  companySettings: any
  invoiceSettings: any
}

export function SettingsClient({ companySettings, invoiceSettings }: Props) {
  const [company, setCompany] = useState({
    name:               companySettings.name               ?? '',
    address:            companySettings.address            ?? '',
    org_number:         companySettings.org_number         ?? companySettings.tax_id ?? '',
    vat_number:         companySettings.vat_number         ?? '',
    phone:              companySettings.phone              ?? '',
    email:              companySettings.email              ?? '',
    bankgiro:           companySettings.bankgiro           ?? '',
  })
  const [invoice, setInvoice] = useState({
    default_tax_rate: invoiceSettings.default_tax_rate ?? DEFAULT_VAT_RATE,
    payment_terms_days: invoiceSettings.payment_terms_days ?? 30,
  })
  const [isPending, startTransition] = useTransition()

  function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await saveCompanySettings(company)
      if (r.error) toast.error(r.error)
      else toast.success('Company settings saved')
    })
  }

  function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await saveInvoiceSettings(invoice)
      if (r.error) toast.error(r.error)
      else toast.success('Invoice settings saved')
    })
  }

  return (
    <Tabs defaultValue="company">
      <TabsList className="mb-6">
        <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Company</TabsTrigger>
        <TabsTrigger value="invoice" className="gap-2"><FileText className="h-4 w-4" />Invoices</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <Card className="border-border shadow-sm max-w-xl">
          <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="space-y-2"><Label>Företagsnamn</Label><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} disabled={isPending} /></div>
              <div className="space-y-2"><Label>Adress</Label><Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} disabled={isPending} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organisationsnummer</Label>
                  <Input placeholder="556xxx-xxxx" value={company.org_number} onChange={(e) => setCompany({ ...company, org_number: e.target.value })} disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label>Momsregistreringsnummer</Label>
                  <Input placeholder="SE556xxxxxxxx01" value={company.vat_number} onChange={(e) => setCompany({ ...company, vat_number: e.target.value })} disabled={isPending} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bankgiro</Label>
                  <Input placeholder="1234-5678" value={company.bankgiro} onChange={(e) => setCompany({ ...company, bankgiro: e.target.value })} disabled={isPending} />
                </div>
                <div className="space-y-2"><Label>Telefon</Label><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} disabled={isPending} /></div>
              </div>
              <div className="space-y-2"><Label>E-post</Label><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} disabled={isPending} /></div>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invoice">
        <Card className="border-border shadow-sm max-w-xl">
          <CardHeader><CardTitle className="text-base">Invoice Defaults</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <div className="space-y-2"><Label>Default VAT Rate (%)</Label><Input type="number" min="0" max="100" value={invoice.default_tax_rate} onChange={(e) => setInvoice({ ...invoice, default_tax_rate: parseFloat(e.target.value) || 0 })} disabled={isPending} /></div>
              <div className="space-y-2"><Label>Payment Terms (days)</Label><Input type="number" min="0" value={invoice.payment_terms_days} onChange={(e) => setInvoice({ ...invoice, payment_terms_days: parseInt(e.target.value) || 30 })} disabled={isPending} /></div>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
