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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ChevronDown } from '@/components/icons'
import { createCategory, updateCategory, softDeleteCategory } from './actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { ImageUpload } from '@/components/ui/image-upload'

interface Props {
  initialCategories: Category[]
  subcategories: Category[]
}

export function CategoriesClient({ initialCategories, subcategories }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [categories, setCategories] = useState(initialCategories)
  useEffect(() => { setCategories(initialCategories) }, [initialCategories])
  const [search, setSearch] = useState('')
  const [filterSubId, setFilterSubId] = useState('')
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
    let list = categories
    if (filterSubId) {
      const sub = subcategories.find(s => s.id === filterSubId)
      list = sub ? list.filter(c => c.id === sub.parent_id) : []
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
      )
    }
    return list
  }, [categories, subcategories, search, filterSubId])

  function openCreate() {
    setEditing(null); setName(''); setSlug(''); setParentId(null); setImageUrl(null); setDisplayStyle('list')
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat); setName(cat.name); setSlug(cat.slug); setParentId(null); setImageUrl(cat.image_url); setDisplayStyle(cat.display_style || 'list')
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setConfirmId(id)
  }

  function doDelete() {
    if (!confirmId) return
    startTransition(async () => {
      const result = await softDeleteCategory(confirmId)
      if (result.error) { toast.error(result.error); return }
      setCategories((prev) => prev.filter((c) => c.id !== confirmId))
      setConfirmId(null)
      toast.success('Category archived')
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
        toast.error(`Failed to archive ${errors.length} categor${errors.length === 1 ? 'y' : 'ies'}`)
      } else {
        toast.success(`Archived ${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}`)
        setCategories(prev => prev.filter(c => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
      }
      setConfirmBulkDelete(false)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, { name, slug, parent_id: parentId, image_url: imageUrl, display_style: displayStyle })
        : await createCategory({ name, slug, parent_id: parentId, image_url: imageUrl, display_style: displayStyle })
      if (result.error) { toast.error(result.error); return }
      toast.success(editing ? 'Category updated' : 'Category created')
      setDialogOpen(false)
      router.refresh()
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (c: Category) => (
        <div className="flex items-center gap-3">
          {c.image_url ? (
            <NextImage src={c.image_url} alt={c.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-600">{c.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      cell: (c: Category) => <span className="text-xs text-muted-foreground font-mono">{c.slug}</span>,
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
            <DropdownMenuItem onClick={() => openEdit(c)} className="gap-2">
              <Pencil className="h-4 w-4" />Edit
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDelete(c.id)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />Archive
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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative min-w-[200px]">
          <select
            value={filterSubId}
            onChange={e => setFilterSubId(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors"
          >
            <option value="">All sub-categories</option>
            {subcategories.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 ml-auto">
            <Plus className="h-4 w-4" />New Category
          </Button>
        )}
      </div>
      <DataTable 
        columns={columns} 
        data={filtered} 
        emptyMessage={search ? 'No categories match your search.' : 'No categories yet.'}
        selectable={canDelete}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
      />

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
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            <ImageUpload value={imageUrl} onChange={setImageUrl} folder="categories" />
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }}
                required disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={isPending} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-display">Display Style</Label>
              <div className="relative">
                <select
                  id="cat-display"
                  value={displayStyle}
                  onChange={e => setDisplayStyle(e.target.value as 'list' | 'grouped')}
                  disabled={isPending}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm text-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 transition-colors"
                >
                  <option value="list">List (flat table)</option>
                  <option value="grouped">Grouped (by product family)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">How products in this category are displayed</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(o) => { if (!o) setConfirmId(null) }}
        title="Archive category?"
        description="This category will be hidden from all products and the storefront."
        confirmLabel="Archive"
        onConfirm={doDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Archive ${selectedIds.size} categor${selectedIds.size === 1 ? 'y' : 'ies'}?`}
        description="These categories will be hidden from all products and the storefront."
        confirmLabel="Archive All"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
