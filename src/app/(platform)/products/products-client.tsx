'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import Link from 'next/link'
import type { Product, Category, ProductFamily } from '@/types'
import { useRole } from '@/hooks/use-role'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { FilterSelect } from '@/components/ui/filter-select'
import { Pagination } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableRowActionsMenu } from '@/components/ui/table-row-actions-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createArchiveAction, createExportAction } from '@/lib/bulk-actions'
import { ProductForm } from './product-form'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Plus, Search, Pencil, Trash2, Loader2 } from '@/components/icons'
import { createProduct, updateProduct, softDeleteProduct } from './actions'
import type { ProductInput } from '@/lib/validators'

interface PaginationInfo { page: number; totalPages: number; totalCount: number; pageSize: number }
interface Props {
  initialProducts: Product[]
  categories: Category[]
  families: ProductFamily[]
  pagination: PaginationInfo
}

const EMPTY_PRODUCT: ProductInput = {
  name: '', secondary_name: null, description: '', invoice_notes: null, slug: null,
  ref: '', brand: null, category_id: null, family_id: null,
  unit_price: 0, cost_price: null, currency: 'SEK', unit: null, weight_kg: null,
  is_active: true, is_featured: false, hide_in_shop: false, is_promotional: false,
  alert_quantity: 0, image_url: null, product_family: null, display_order: 0,
}

export function ProductsClient({ initialProducts, categories, families, pagination }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const products = initialProducts
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_PRODUCT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q)
    const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && p.is_active) || (statusFilter === 'inactive' && !p.is_active)
    return matchSearch && matchCategory && matchStatus
  }), [products, search, categoryFilter, statusFilter])

  function openCreate() {
    setEditing(null); setForm(EMPTY_PRODUCT); setErrors({}); setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name, secondary_name: product.secondary_name ?? null,
      description: product.description ?? '', invoice_notes: product.invoice_notes ?? null,
      slug: product.slug ?? null, ref: product.ref, brand: product.brand ?? null,
      category_id: product.category_id ?? null, family_id: product.family_id ?? null,
      unit_price: product.unit_price, cost_price: product.cost_price ?? null,
      currency: product.currency, unit: product.unit ?? null, weight_kg: product.weight_kg ?? null,
      is_active: product.is_active, is_featured: product.is_featured ?? false,
      hide_in_shop: product.hide_in_shop ?? false, is_promotional: product.is_promotional ?? false,
      alert_quantity: product.alert_quantity ?? 0, image_url: product.image_url ?? null,
      product_family: product.product_family ?? null, display_order: product.display_order ?? 0,
    })
    setErrors({}); setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErrors({})
    startTransition(async () => {
      const result = editing ? await updateProduct(editing.id, form) : await createProduct(form)
      if (result.error) { toast.error(result.error); return }
      if (result.fieldErrors) { setErrors(result.fieldErrors); return }
      toast.success(editing ? 'Product updated' : 'Product created')
      setDialogOpen(false); router.refresh()
    })
  }

  function doDelete() {
    if (!confirmId) return
    startTransition(async () => {
      const result = await softDeleteProduct(confirmId)
      if (result.error) { toast.error(result.error); return }
      setConfirmId(null); toast.success('Product archived'); router.refresh()
    })
  }

  // Bulk action handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(p => p.id)))
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
        const result = await softDeleteProduct(id)
        if (result.error) errors.push(`${id}: ${result.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to archive ${errors.length} product(s)`)
      } else {
        toast.success(`Archived ${ids.length} product(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirmBulkDelete(false)
    })
  }

  const columns = [
    {
      key: 'name', header: 'Product',
      cell: (p: Product) => (
        <div className="flex items-center gap-3">
          {p.image_url ? (
            <NextImage src={p.image_url} alt={p.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-violet-600">{p.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <Link href={`/products/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{p.name}</Link>
            <p className="text-xs text-muted-foreground font-mono">REF: {p.ref}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category', header: 'Category',
      cell: (p: Product) => p.category?.name
        ? <Badge className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0 text-xs">{p.category.name}</Badge>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'price', header: 'Price',
      cell: (p: Product) => <span className="text-sm font-medium">{formatCurrency(p.unit_price, p.currency)}</span>,
    },
    {
      key: 'status', header: 'Status',
      cell: (p: Product) => (
        <StatusBadge status={p.is_active ? 'active' : 'inactive'} type="product" />
      ),
    },
    ...(canWrite ? [{
      key: 'actions', header: '', className: 'w-12', stopPropagation: true,
      cell: (p: Product) => (
        <TableRowActionsMenu
          items={[
            {
              label: 'Edit',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => openEdit(p),
            },
            {
              label: 'Archive',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setConfirmId(p.id),
              variant: 'destructive',
              show: canDelete,
            },
          ]}
        />
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect className="w-44" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect className="w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />New Product
          </Button>
        )}
      </div>

      {(canWrite || canDelete) && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            ...(canWrite ? [createExportAction(() => {
              const selectedProducts = initialProducts.filter(p => selectedIds.has(p.id))
              const csv = [
                ['Name', 'SKU', 'Price', 'Stock', 'Category'].join(','),
                ...selectedProducts.map(p => [
                  p.name,
                  p.ref,
                  p.unit_price,
                  (p as any).stock_quantity || 0,
                  p.category?.name || ''
                ].join(','))
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              URL.revokeObjectURL(url)
              toast.success(`Exported ${selectedProducts.length} product(s)`)
            })] : []),
            ...(canDelete ? [createArchiveAction(handleBulkDelete)] : []),
          ]}
        />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={search ? 'No products match your search.' : 'No products yet.'}
        onRowClick={p => router.push(`/products/${p.id}`)}
        selectable={canWrite || canDelete}
        selectedIds={selectedIds}
        onSelectAll={(canWrite || canDelete) ? handleSelectAll : undefined}
        onSelectRow={(canWrite || canDelete) ? handleSelectRow : undefined}
      />
      <Pagination {...pagination} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'New product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="pt-1">
            <ProductForm form={form} setForm={setForm} categories={categories} families={families} errors={errors} isPending={isPending} />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save changes' : 'Create product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={o => { if (!o) setConfirmId(null) }}
        title="Archive product?"
        description="The product will no longer appear in catalogs or the shop."
        confirmLabel="Archive"
        onConfirm={doDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Archive ${selectedIds.size} product(s)?`}
        description="These products will no longer appear in catalogs or the shop."
        confirmLabel="Archive All"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
