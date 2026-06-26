'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FilterSelect } from '@/components/ui/filter-select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { Pencil, Loader2 } from '@/components/icons'
import { updateCustomer } from '../actions'
import type { CustomerInput } from '@/lib/validators'
import { useRole } from '@/hooks/use-role'

type DiscountGroup = {
  id: string
  name: string
  discount_rate: number
}

export function EditCustomerDialog({ customer, discountGroups = [] }: { customer: Customer; discountGroups?: DiscountGroup[] }) {
  const router = useRouter()
  const { canWrite } = useRole()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CustomerInput>({
    name: customer.name,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    tax_id: customer.tax_id ?? '',
    notes: customer.notes ?? '',
    org_number: customer.org_number ?? '',
    contact_person: customer.contact_person ?? '',
    website: customer.website ?? '',
    discount_group_id: (customer as any).discount_group_id ?? null,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await updateCustomer(customer.id, form)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success('Customer updated')
      setOpen(false)
      router.refresh()
    })
  }

  if (!canWrite) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />Edit
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-4">
            {/* Company Information */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Company Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label>Organization Number</Label>
                  <Input value={form.org_number ?? ''} onChange={(e) => setForm({ ...form, org_number: e.target.value })} disabled={isPending} placeholder="556789-1234" />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID / VAT</Label>
                  <Input value={form.tax_id ?? ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} disabled={isPending} placeholder="SE556789123401" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={isPending} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} disabled={isPending} placeholder="www.example.com" />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Person</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.contact_person ?? ''} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} disabled={isPending} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={isPending} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={isPending} rows={2} placeholder="Internal notes (not visible to customer)" />
            </div>

            {/* Discount Group */}
            <div className="space-y-2">
              <Label>Discount Group</Label>
              <FilterSelect 
                value={form.discount_group_id ?? ''} 
                onChange={(e) => setForm({ ...form, discount_group_id: e.target.value || null })}
                disabled={isPending}
              >
                <option value="">No discount</option>
                {discountGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.discount_rate}%)
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
