'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Course, CourseCategory, CourseLevel } from '@/types'
import { DataTable, type Column } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TableRowActionsMenu } from '@/components/ui/table-row-actions-menu'
import { ImageUpload } from '@/components/ui/image-upload'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Eye, Loader2, Calendar } from '@/components/icons'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createDeleteAction, createExportAction } from '@/lib/bulk-actions'
import { createCourse, updateCourse, deleteCourse } from './actions'
import { formatDate } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'

interface Props {
  initialCourses: Course[]
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  start_date: '',
  end_date: '',
  duration_days: 1,
  location: '',
  country: '',
  category: 'other' as CourseCategory,
  level: 'beginner' as CourseLevel,
  instructor_name: '',
  instructor_bio: '',
  image_url: null as string | null,
  hubspot_form_code: '',
  is_published: false,
}

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function ProgramsManagementClient({ initialCourses }: Props) {
  const router = useRouter()
  const { canWrite, canDelete } = useRole()
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase()
      return !search || c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
    })
  }, [courses, search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(course: Course) {
    setEditing(course)
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      start_date: course.start_date.split('T')[0],
      end_date: course.end_date?.split('T')[0] ?? '',
      duration_days: course.duration_days,
      location: course.location,
      country: course.country,
      category: course.category,
      level: course.level,
      instructor_name: course.instructor_name ?? '',
      instructor_bio: course.instructor_bio ?? '',
      image_url: course.image_url,
      hubspot_form_code: course.hubspot_form_code ?? '',
      is_published: course.is_published,
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        ...form,
        category: 'other' as CourseCategory,
        end_date: form.end_date || null,
        instructor_name: form.instructor_name || null,
        instructor_bio: form.instructor_bio || null,
        hubspot_form_code: form.hubspot_form_code || null,
      }

      const result = editing
        ? await updateCourse(editing.id, payload)
        : await createCourse(payload)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(editing ? 'Course updated' : 'Course created')
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCourse(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Course deleted')
      setConfirmDeleteId(null)
      router.refresh()
    })
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
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
        const result = await deleteCourse(id)
        if (result.error) failures.push(id)
      }

      if (failures.length > 0) {
        toast.error(`Failed to delete ${failures.length} course(s)`)
      } else {
        toast.success(`Deleted ${ids.length} course(s)`)
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirmBulkDelete(false)
    })
  }

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: 'Course',
      className: 'whitespace-normal',
      cell: (c) => (
        <div className="max-w-md">
          <span className="text-sm font-semibold text-foreground break-words">{c.title}</span>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {c.location}, {c.country}
          </p>
        </div>
      ),
    },
    {
      key: 'start_date',
      header: 'Date',
      cell: (c) => (
        <span className="text-sm text-muted-foreground">{formatDate(c.start_date)}</span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      cell: (c) => (
        <span className="text-sm text-muted-foreground capitalize">{c.level}</span>
      ),
    },
    {
      key: 'is_published',
      header: 'Status',
      cell: (c) => (
        <StatusBadge status={c.is_published ? 'active' : 'draft'} />
      ),
    },
    ...(canWrite || canDelete ? [{
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (c: Course) => (
        <TableRowActionsMenu
          items={[
            {
              label: 'View',
              icon: <Eye className="h-4 w-4" />,
              href: `/shop/programs/${c.slug}`,
              target: '_blank',
            },
            {
              label: 'Edit',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => openEdit(c),
              show: canWrite,
            },
            {
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setConfirmDeleteId(c.id),
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
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Course
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
                    const selected = initialCourses.filter((c) => selectedIds.has(c.id))
                    const csv = [
                      ['Title', 'Slug', 'Location', 'Country', 'Start date', 'Status'].join(','),
                      ...selected.map((c) =>
                        [
                          `"${c.title.replace(/"/g, '""')}"`,
                          c.slug,
                          `"${c.location.replace(/"/g, '""')}"`,
                          c.country,
                          formatDate(c.start_date),
                          c.is_published ? 'Published' : 'Draft',
                        ].join(','),
                      ),
                    ].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `programs-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success(`Exported ${selected.length} course(s)`)
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
        emptyMessage="No courses yet."
        onRowClick={canWrite ? (c) => openEdit(c) : undefined}
        selectable={canWrite || canDelete}
        selectedIds={selectedIds}
        onSelectAll={canWrite || canDelete ? handleSelectAll : undefined}
        onSelectRow={canWrite || canDelete ? handleSelectRow : undefined}
      />

      {/* Create/Edit Dialog */}
      {canWrite && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Course' : 'New Course'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* Image */}
            <div className="space-y-1.5">
              <Label>Course Image</Label>
              <ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} folder="programs" />
            </div>

            {/* Title & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value
                    setForm(f => ({
                      ...f,
                      title,
                      slug: !editing ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : f.slug,
                    }))
                  }}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} disabled={isPending} required />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                disabled={isPending}
                rows={4}
                required
              />
            </div>

            {/* Dates & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration_days">Duration (Days) *</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={form.duration_days}
                  onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 1 }))}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            {/* Location & Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} disabled={isPending} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country *</Label>
                <Input id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} disabled={isPending} required />
              </div>
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <Label htmlFor="level">Level *</Label>
              <select
                id="level"
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: e.target.value as CourseLevel }))}
                disabled={isPending}
                className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm"
                required
              >
                {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Instructor */}
            <div className="space-y-1.5">
              <Label htmlFor="instructor_name">Instructor Name</Label>
              <Input id="instructor_name" value={form.instructor_name} onChange={e => setForm(f => ({ ...f, instructor_name: e.target.value }))} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor_bio">Instructor Bio</Label>
              <Textarea
                id="instructor_bio"
                value={form.instructor_bio}
                onChange={e => setForm(f => ({ ...f, instructor_bio: e.target.value }))}
                disabled={isPending}
                rows={3}
              />
            </div>

            {/* HubSpot Form Code */}
            <div className="space-y-1.5">
              <Label htmlFor="hubspot_form_code">HubSpot Embed Code</Label>
              <Textarea
                id="hubspot_form_code"
                value={form.hubspot_form_code}
                onChange={e => setForm(f => ({ ...f, hubspot_form_code: e.target.value }))}
                disabled={isPending}
                rows={3}
                placeholder="<script>...</script> or <iframe>...</iframe>"
              />
            </div>

            {/* Published */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="is_published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm(f => ({ ...f, is_published: !!checked }))}
                disabled={isPending}
              />
              <Label htmlFor="is_published" className="cursor-pointer font-normal">
                Publish course (visible to public)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}

      {/* Delete Confirmation */}
      {canDelete && confirmDeleteId && (
        <ConfirmDialog
          open
          onOpenChange={o => { if (!o) setConfirmDeleteId(null) }}
          title="Delete course?"
          description="This will permanently delete the course and all associated testimonials."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedIds.size} course(s)?`}
        description="These courses will be permanently deleted along with associated testimonials."
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={doBulkDelete}
      />
    </div>
  )
}
