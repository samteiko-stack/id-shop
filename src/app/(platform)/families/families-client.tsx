'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import type { Category, ProductFamily } from '@/types'
import { useRole } from '@/hooks/use-role'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ChevronDown } from '@/components/icons'
import { createProductFamily, updateProductFamily, deleteProductFamily } from '../products/actions'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import type { ProductFamilyInput } from '@/lib/validators'

const EMPTY: ProductFamilyInput = { name: '', category_id: null, image_url: null, display_order: 0 }

interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }
interface Props {
  initialFamilies: ProductFamily[]
  categories: Category[]
  pagination: PaginationInfo
}

export function FamiliesClient({ initialFamilies, categories, pagination }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [search, setSearch] = useState('')
  const [filterSubId, setFilterSubId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductFamily | null>(null)
  const [form, setForm] = useState<ProductFamilyInput>(EMPTY)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const subcategories = useMemo(() => categories.filter(c => !!c.parent_id), [categories])
  const topCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories])

  const filtered = useMemo(() => {
    let list = initialFamilies
    if (filterSubId) list = list.filter(f => f.category_id === filterSubId)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.category as any)?.name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [initialFamilies, search, filterSubId])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(family: ProductFamily) {
    setEditing(family)
    setForm({ name: family.name, category_id: family.category_id, image_url: family.image_url, display_order: family.display_order })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = editing
        ? await updateProductFamily(editing.id, form)
        : await createProductFamily(form)
      if (res.error) { toast.error(res.error); return }
      toast.success(editing ? 'Family updated' : 'Family created')
      setDialogOpen(false)
      router.refresh()
    })
  }

  function doDelete() {
    if (!confirmId) return
    startTransition(async () => {
      const res = await deleteProductFamily(confirmId)
      if (res.error) { toast.error(res.error); return }
      setConfirmId(null)
      toast.success('Family deleted')
      router.refresh()
    })
  }

  // Bulk action handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(f => f.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  function handleBulkDelete() {
    setConfirmBulkDelete(true)
  }

  function doBulkDelete() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const res = await deleteProductFamily(id)
        if (res.error) errors.push(`${id}: ${res.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to delete ${errors.length} famil${errors.length === 1 ? 'y' : 'ies'}`)
      } else {
        toast.success(`Deleted ${ids.length} famil${ids.length === 1 ? 'y' : 'ies'}`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirmBulkDelete(false)
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Family',
      cell: (f: ProductFamily) => (
        <div className="flex items-center gap-3">
          {f.image_url ? (
            <NextImage src={f.image_url} alt={f.name} width={32} height={32} className="w-8 h-8 rounded-lg object-contain border border-border bg-muted shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-violet-600">{f.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">{f.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (f: ProductFamily) => (
        <span className="text-sm text-muted-foreground">
          {(f.category as any)?.name ?? '—'}
        </span>
      ),
    },
    ...(canWrite ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (f: ProductFamily) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(f)} className="gap-2">
              <Pencil className="h-4 w-4" />Edit
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmId(f.id)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search families…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={filterSubId}
            onChange={e => setFilterSubId(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
          >
            <option value="">All sub-categories</option>
            {topCategories.map(parent => {
              const children = subcategories.filter(s => s.parent_id === parent.id)
              if (!children.length) return null
              return (
                <optgroup key={parent.id} label={parent.name}>
                  {children.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              )
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 ml-auto">
            <Plus className="h-4 w-4" />New Family
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={search ? 'No families match your search.' : 'No families yet.'}
        selectable={canDelete}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
      />

      <Pagination {...pagination} />

      {canDelete && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            {
              label: 'Delete',
              icon: Trash2,
              onClick: handleBulkDelete,
              variant: 'destructive',
            },
          ]}
        />
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit family' : 'New product family'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <ImageUpload value={form.image_url ?? null} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" />

            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={isPending} placeholder="t.ex. Bio-Gide" />
            </div>

            <div className="space-y-1.5">
              <Label>Sub-category *</Label>
              <div className="relative">
                <select
                  value={form.category_id ?? ''}
                  onChange={e => setForm({ ...form, category_id: e.target.value || null })}
                  disabled={isPending}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
                >
                  <option value="">Select sub-category…</option>
                  {(() => {
                    const topLevel = categories.filter(c => !c.parent_id)
                    const subs = categories.filter(c => !!c.parent_id)
                    return topLevel.map(parent => {
                      const children = subs.filter(c => c.parent_id === parent.id)
                      if (!children.length) return null
                      return (
                        <optgroup key={parent.id} label={parent.name}>
                          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                      )
                    })
                  })()}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending || !form.name.trim()}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={o => { if (!o) setConfirmId(null) }}
        title="Delete family?"
        description="Products in this family won't be deleted but will lose their family assignment."
        confirmLabel="Delete"
        onConfirm={doDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedIds.size} famil${selectedIds.size === 1 ? 'y' : 'ies'}?`}
        description="Products in these families won't be deleted but will lose their family assignments."
        confirmLabel="Delete All"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
