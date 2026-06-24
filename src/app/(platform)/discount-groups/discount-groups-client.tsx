'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Percent, Plus } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/tables/data-table'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createArchiveAction } from '@/lib/bulk-actions'
import { toast } from 'sonner'
import { bulkArchiveDiscountGroups } from './actions'
import { CreateDiscountGroupDialog } from './create-discount-group-dialog'
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

type Props = {
  groups: DiscountGroup[]
}

export function DiscountGroupsClient({ groups }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(groups.map(g => g.id)))
    } else {
      setSelectedIds(new Set())
    }
  }
  
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }
  
  const handleBulkArchive = () => {
    if (!confirm(`Archive ${selectedIds.size} discount group(s)?`)) return
    
    startTransition(async () => {
      const res = await bulkArchiveDiscountGroups(Array.from(selectedIds))
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Archived ${selectedIds.size} discount group(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
    })
  }
  
  const columns: Column<DiscountGroup>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (group) => group.name,
    },
    {
      key: 'discount_rate',
      header: 'Discount %',
      cell: (group) => `${group.discount_rate}%`,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (group) => group.description || '—',
    },
    {
      key: 'is_active',
      header: 'Status',
      cell: (group) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          group.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {group.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]
  
  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
              <Percent className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Discount Groups</h1>
              <p className="text-sm text-muted-foreground">Manage customer discount tiers</p>
            </div>
          </div>
          {canWrite && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Discount Group
            </Button>
          )}
        </div>
        
        {canDelete && selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            actions={[
              createArchiveAction(handleBulkArchive),
            ]}
          />
        )}
        
        <DataTable
          columns={columns}
          data={groups}
          onRowClick={(row) => router.push(`/discount-groups/${row.id}`)}
          selectable={canDelete}
          selectedIds={selectedIds}
          onSelectAll={canDelete ? handleSelectAll : undefined}
          onSelectRow={canDelete ? handleSelectRow : undefined}
          emptyMessage="No discount groups yet."
        />
      </div>
      
      {canWrite && (
        <CreateDiscountGroupDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </PageContainer>
  )
}
