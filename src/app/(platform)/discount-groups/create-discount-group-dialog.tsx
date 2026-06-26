'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/lib/toast'
import { createDiscountGroup } from './actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDiscountGroupDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: '',
    discount_rate: '',
    description: '',
    is_active: true,
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const res = await createDiscountGroup({
        name: formData.name,
        discount_rate: parseFloat(formData.discount_rate),
        description: formData.description || null,
        is_active: formData.is_active,
      })
      
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Discount group created')
        onOpenChange(false)
        setFormData({ name: '', discount_rate: '', description: '', is_active: true })
        router.refresh()
      }
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Discount Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., VIP, Wholesale"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discount_rate">Discount Percentage</Label>
            <Input
              id="discount_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discount_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_rate: e.target.value }))}
              placeholder="e.g., 15"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Internal description"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
            />
            <Label htmlFor="is_active" className="font-normal">
              Active (available for assignment)
            </Label>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
