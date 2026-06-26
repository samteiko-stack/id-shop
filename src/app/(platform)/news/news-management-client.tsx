'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { NewsPost } from '@/types'
import { DataTable, type Column } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableRowActionsMenu } from '@/components/ui/table-row-actions-menu'
import { ImageUpload } from '@/components/ui/image-upload'
import { StatusBadge } from '@/components/ui/status-badge'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createDeleteAction, createExportAction } from '@/lib/bulk-actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, Pencil, Trash2, Eye, Loader2, FilePen } from '@/components/icons'
import { createNewsPost, updateNewsPost, deleteNewsPost, unpublishNewsPost } from './actions'
import { formatDate, slugify } from '@/lib/utils'
import { isRichTextEmpty, toEditorHtml } from '@/lib/rich-text'
import { useRole } from '@/hooks/use-role'
import { toast } from '@/lib/toast'

interface Props {
  initialPosts: NewsPost[]
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  image_url: null as string | null,
  is_published: false,
  published_at: '',
}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toDateInputValue(iso: string | null | undefined) {
  if (!iso) return todayDateInputValue()
  return iso.slice(0, 10)
}

export function NewsManagementClient({ initialPosts }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NewsPost | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return initialPosts
    return initialPosts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q),
    )
  }, [initialPosts, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(post: NewsPost) {
    setEditing(post)
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      body: toEditorHtml(post.body),
      image_url: post.image_url,
      is_published: post.is_published,
      published_at: toDateInputValue(post.published_at),
    })
    setDialogOpen(true)
  }

  function savePost(publish: boolean) {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }

    const slug = form.slug.trim() || slugify(form.title)
    if (!slug) {
      toast.error('Slug is required')
      return
    }

    if (publish && isRichTextEmpty(form.body)) {
      toast.error('Body is required to publish')
      return
    }

    startTransition(async () => {
      const payload = {
        ...form,
        slug,
        excerpt: form.excerpt || null,
        is_published: publish,
        published_at: publish ? form.published_at || todayDateInputValue() : null,
      }
      const result = editing
        ? await updateNewsPost(editing.id, payload)
        : await createNewsPost(payload)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(publish ? 'Article published' : 'Draft saved')
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleUnpublish(id: string) {
    startTransition(async () => {
      const result = await unpublishNewsPost(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Article moved to draft')
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNewsPost(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Article deleted')
      setConfirmDeleteId(null)
      router.refresh()
    })
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map((p) => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  function doBulkDelete() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const failures: string[] = []

      for (const id of ids) {
        const result = await deleteNewsPost(id)
        if (result.error) failures.push(id)
      }

      if (failures.length > 0) {
        toast.error(`Failed to delete ${failures.length} article(s)`)
      } else {
        toast.success(`Deleted ${ids.length} article(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirmBulkDelete(false)
    })
  }

  const columns: Column<NewsPost>[] = [
    {
      key: 'title',
      header: 'Article',
      className: 'whitespace-normal',
      cell: (post) => (
        <div className="max-w-md">
          <span className="text-sm font-semibold text-foreground break-words">{post.title}</span>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{post.slug}</p>
        </div>
      ),
    },
    {
      key: 'published_at',
      header: 'Published',
      cell: (post) => (
        <span className="text-sm text-muted-foreground">
          {post.published_at ? formatDate(post.published_at) : '—'}
        </span>
      ),
    },
    {
      key: 'is_published',
      header: 'Status',
      cell: (post) => (
        <StatusBadge status={post.is_published ? 'published' : 'draft'} />
      ),
    },
    ...(canWrite || canDelete
      ? [{
          key: 'actions',
          header: '',
          className: 'w-12',
          stopPropagation: true,
          cell: (post: NewsPost) => (
            <TableRowActionsMenu
              items={[
                {
                  label: 'View on site',
                  icon: <Eye className="h-4 w-4" />,
                  href: `/shop/nyheter/${post.slug}`,
                  target: '_blank',
                  show: post.is_published,
                },
                {
                  label: 'Unpublish',
                  icon: <FilePen className="h-4 w-4" />,
                  onClick: () => handleUnpublish(post.id),
                  show: canWrite && post.is_published,
                },
                {
                  label: 'Edit',
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: () => openEdit(post),
                  show: canWrite,
                },
                {
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => setConfirmDeleteId(post.id),
                  variant: 'destructive',
                  show: canDelete,
                },
              ]}
            />
          ),
        } as Column<NewsPost>]
      : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />New article
          </Button>
        )}
      </div>

      {(canWrite || canDelete) && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            ...(canWrite
              ? [
                  createExportAction(() => {
                    const selected = initialPosts.filter((p) => selectedIds.has(p.id))
                    const csv = [
                      ['Title', 'Slug', 'Published', 'Status', 'Excerpt'].join(','),
                      ...selected.map((p) =>
                        [
                          `"${p.title.replace(/"/g, '""')}"`,
                          p.slug,
                          p.published_at ? formatDate(p.published_at) : '',
                          p.is_published ? 'Published' : 'Draft',
                          `"${(p.excerpt ?? '').replace(/"/g, '""')}"`,
                        ].join(','),
                      ),
                    ].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `news-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success(`Exported ${selected.length} article(s)`)
                  }),
                ]
              : []),
            ...(canDelete ? [createDeleteAction(() => setConfirmBulkDelete(true))] : []),
          ]}
        />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No articles yet."
        onRowClick={canWrite ? (post) => openEdit(post) : undefined}
        selectable={canWrite || canDelete}
        selectedIds={selectedIds}
        onSelectAll={canWrite || canDelete ? handleSelectAll : undefined}
        onSelectRow={canWrite || canDelete ? handleSelectRow : undefined}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit article' : 'New article'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              savePost(form.is_published)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: editing ? f.slug : slugify(title),
                  }))
                }}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                required
                disabled={isPending}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                disabled={isPending}
                placeholder="Short summary for the news list…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body <span className="font-normal text-muted-foreground">(required to publish)</span></Label>
              <RichTextEditor
                id="body"
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                disabled={isPending}
                placeholder="Write the article body…"
              />
            </div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                folder="news"
              />
            </div>
            <DialogFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full space-y-3 sm:max-w-xs">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_published"
                    checked={form.is_published}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        is_published: checked === true,
                        published_at:
                          checked === true && !f.published_at ? todayDateInputValue() : f.published_at,
                      }))
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="is_published" className="font-normal cursor-pointer">
                    Publish on storefront
                  </Label>
                </div>
                {form.is_published && (
                  <div className="space-y-2">
                    <Label htmlFor="published_at">Publish date *</Label>
                    <Input
                      id="published_at"
                      type="date"
                      value={form.published_at}
                      onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                      required
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col-reverse gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                {canWrite && (
                  <Button
                    type="button"
                    variant={form.is_published ? 'outline' : 'default'}
                    disabled={isPending}
                    onClick={() => savePost(false)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save draft'}
                  </Button>
                )}
                {canWrite && form.is_published && (
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : editing ? (
                      'Publish changes'
                    ) : (
                      'Publish'
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmDeleteId && (
        <ConfirmDialog
          open
          onOpenChange={(o) => { if (!o) setConfirmDeleteId(null) }}
          title="Delete article?"
          description="This article will be removed from the storefront."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedIds.size} article(s)?`}
        description="These articles will be removed from the storefront."
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
