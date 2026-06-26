'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import type { Category } from '@/types'
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
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ChevronDown } from '@/components/icons'
import { createCategory, updateCategory, softDeleteCategory } from '../categories/actions'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'

interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }
interface Props {
  initialSubcategories: Category[]
  topLevelCategories: Category[]
  pagination: PaginationInfo
}

export function SubcategoriesClient({ initialSubcategories, topLevelCategories, pagination }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [subcategories, setSubcategories] = useState(initialSubcategories)
  useEffect(() => { setSubcategories(initialSubcategories) }, [initialSubcategories])
  const [search, setSearch] = useState('')
  const [filterCatId, setFilterCatId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [displayStyle, setDisplayStyle] = useState<'list' | 'grouped'>('list')
  const [isPending, startTransition] = useTransition()

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const filtered = useMemo(() => {
    let list = subcategories
    if (filterCatId) list = list.filter(c => c.parent_id === filterCatId)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        topLevelCategories.find(p => p.id === c.parent_id)?.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [subcategories, search, filterCatId, topLevelCategories])

  function openCreate() {
    setEditing(null); setName(''); setSlug(''); setParentId(null); setImageUrl(null); setDisplayStyle('list')
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat); setName(cat.name); setSlug(cat.slug ?? ''); setParentId(cat.parent_id); setImageUrl(cat.image_url); setDisplayStyle(cat.display_style || 'list')
    setDialogOpen(true)
  }

  function doDelete() {
    if (!confirmId) return
    startTransition(async () => {
      const result = await softDeleteCategory(confirmId)
      if (result.error) { toast.error(result.error); return }
      setSubcategories(prev => prev.filter(c => c.id !== confirmId))
      setConfirmId(null)
      toast.success('Sub-category archived')
    })
  }

  // Bulk action handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(c => c.id)))
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
        const result = await softDeleteCategory(id)
        if (result.error) errors.push(`${id}: ${result.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to archive ${errors.length} sub-categor${errors.length === 1 ? 'y' : 'ies'}`)
      } else {
        toast.success(`Archived ${ids.length} sub-categor${ids.length === 1 ? 'y' : 'ies'}`)
        setSubcategories(prev => prev.filter(c => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
      }
      setConfirmBulkDelete(false)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parentId) { toast.error('Please select a parent category'); return }
    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, { name, slug, parent_id: parentId, image_url: imageUrl, display_style: displayStyle })
        : await createCategory({ name, slug, parent_id: parentId, image_url: imageUrl, display_style: displayStyle })
      if (result.error) { toast.error(result.error); return }
      toast.success(editing ? 'Sub-category updated' : 'Sub-category created')
      setDialogOpen(false)
      router.refresh()
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Sub-category',
      cell: (c: Category) => (
        <div className="flex items-center gap-3">
          {c.image_url ? (
            <NextImage src={c.image_url} alt={c.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-sky-600">{c.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent Category',
      cell: (c: Category) => {
        const parent = topLevelCategories.find(p => p.id === c.parent_id)
        return <span className="text-sm text-muted-foreground">{parent?.name ?? '—'}</span>
      },
    },
    {
      key: 'display_style',
      header: 'Display',
      cell: (c: Category) => (
        <span className="text-xs text-muted-foreground capitalize">{c.display_style ?? 'list'}</span>
      ),
    },
    ...(canWrite ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (c: Category) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(c)} className="gap-2"><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmId(c.id)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />Archive</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sub-categories…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={filterCatId}
            onChange={e => setFilterCatId(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
          >
            <option value="">All categories</option>
            {topLevelCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 ml-auto">
            <Plus className="h-4 w-4" />New Sub-category
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={search ? 'No sub-categories match.' : 'No sub-categories yet.'}
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
              label: 'Archive',
              icon: Trash2,
              onClick: handleBulkDelete,
              variant: 'destructive',
            },
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Sub-category' : 'New Sub-category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <ImageUpload value={imageUrl} onChange={setImageUrl} folder="categories" />

            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={e => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} required disabled={isPending} />
            </div>

            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} required disabled={isPending} className="font-mono" />
            </div>

            <div className="space-y-1.5">
              <Label>Parent Category *</Label>
              <div className="relative">
                <select
                  value={parentId ?? ''}
                  onChange={e => setParentId(e.target.value || null)}
                  disabled={isPending}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
                >
                  <option value="">Select a category…</option>
                  {topLevelCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Display Style</Label>
              <div className="relative">
                <select
                  value={displayStyle}
                  onChange={e => setDisplayStyle(e.target.value as 'list' | 'grouped')}
                  disabled={isPending}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
                >
                  <option value="list">List (flat table)</option>
                  <option value="grouped">Grouped (by family)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">How products in this sub-category are displayed in the shop</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending || !parentId}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={o => { if (!o) setConfirmId(null) }}
        title="Archive sub-category?"
        description="This sub-category will be hidden from all products and the storefront."
        confirmLabel="Archive"
        onConfirm={doDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Archive ${selectedIds.size} sub-categor${selectedIds.size === 1 ? 'y' : 'ies'}?`}
        description="These sub-categories will be hidden from all products and the storefront."
        confirmLabel="Archive All"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
