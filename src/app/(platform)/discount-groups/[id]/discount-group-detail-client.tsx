'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Percent, ArrowLeft, Pencil, Trash2 } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { softDeleteDiscountGroup } from '../actions'
import { EditDiscountGroupDialog } from './edit-discount-group-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { useRole } from '@/hooks/use-role'

type DiscountGroup = {
  id: string
  name: string
  discount_rate: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type Customer = {
  id: string
  name: string
  email: string | null
}

type Props = {
  group: DiscountGroup
  customers: Customer[]
  customerCount: number
}

export function DiscountGroupDetailClient({ group, customers, customerCount }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [isPending, startTransition] = useTransition()
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  const handleDelete = () => {
    if (!confirm(`Archive "${group.name}"? Customers will keep their current discount rate.`)) return
    
    startTransition(async () => {
      const res = await softDeleteDiscountGroup(group.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Discount group archived')
        router.push('/discount-groups')
      }
    })
  }
  
  return (
    <PageContainer maxWidth="4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <ButtonLink href="/discount-groups" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </ButtonLink>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-card">
                <Percent className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{group.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {group.discount_rate}% discount
                </p>
              </div>
            </div>
          </div>
          
          {canWrite && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-medium">Details</h2>
          </div>
          <div className="divide-y">
            <div className="grid grid-cols-3 gap-4 p-4">
              <div className="text-sm text-muted-foreground">Discount Rate</div>
              <div className="col-span-2 text-sm font-medium">{group.discount_rate}%</div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="col-span-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  group.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {group.description && (
              <div className="grid grid-cols-3 gap-4 p-4">
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="col-span-2 text-sm">{group.description}</div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 p-4">
              <div className="text-sm text-muted-foreground">Customers</div>
              <div className="col-span-2 text-sm font-medium">{customerCount}</div>
            </div>
          </div>
        </div>
        
        {/* Customers using this group */}
        {customers.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="font-medium">Customers ({customerCount})</h2>
            </div>
            <div className="divide-y">
              {customers.slice(0, 10).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    {customer.email && (
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {customerCount > 10 && (
              <div className="border-t p-4 text-center text-sm text-muted-foreground">
                Showing 10 of {customerCount} customers
              </div>
            )}
          </div>
        )}
      </div>
      
      {canWrite && (
        <EditDiscountGroupDialog
          group={group}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </PageContainer>
  )
}
