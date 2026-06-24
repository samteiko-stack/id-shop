'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, UserRole } from '@/types'
import { ROLE_LABELS } from '@/constants/roles'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilterSelect } from '@/components/ui/filter-select'
import { getInitials, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { UserPlus, MoreHorizontal, ShieldCheck, UserX, UserCheck, Loader2, AlertCircle, Search } from '@/components/icons'
import { inviteUser, updateUserRole, toggleUserActive } from './actions'
import { ConfirmDialog, type ConfirmVariant } from '@/components/ui/confirm-dialog'
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  admin:     'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] border-0',
  staff:     'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0',
  read_only: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0',
  customer:  'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0',
}

interface Props {
  initialUsers: User[]
  error?: string
}

export function UserManagementClient({ initialUsers, error }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  useEffect(() => { setUsers(initialUsers) }, [initialUsers])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFullName, setInviteFullName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('staff')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: ConfirmVariant
    onConfirm: () => void
  } | null>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDeactivate, setConfirmBulkDeactivate] = useState(false)

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    startTransition(async () => {
      const result = await inviteUser({
        email: inviteEmail,
        full_name: inviteFullName,
        role: inviteRole,
      })
      if (result.error) {
        setInviteError(result.error)
        return
      }
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteEmail('')
      setInviteFullName('')
      setInviteRole('staff')
      router.refresh()
    })
  }

  function handleRoleChange(userId: string, role: UserRole) {
    const user = users.find(u => u.id === userId)
    setPendingConfirm({
      title: `Change role to ${ROLE_LABELS[role]}?`,
      description: `${user?.full_name ?? user?.email ?? 'This user'} will have their role changed. This affects what they can access in the platform.`,
      confirmLabel: 'Change Role',
      variant: 'warning',
      onConfirm: () => {
        startTransition(async () => {
          const result = await updateUserRole(userId, role)
          if (result.error) { toast.error(result.error); return }
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
          toast.success('Role updated')
        })
      },
    })
  }

  function handleToggleActive(userId: string, isActive: boolean) {
    const user = users.find(u => u.id === userId)
    setPendingConfirm({
      title: isActive ? 'Deactivate user?' : 'Reactivate user?',
      description: isActive
        ? `${user?.full_name ?? user?.email ?? 'This user'} will lose access to the platform immediately.`
        : `${user?.full_name ?? user?.email ?? 'This user'} will regain access to the platform.`,
      confirmLabel: isActive ? 'Deactivate' : 'Reactivate',
      variant: isActive ? 'destructive' : 'default',
      onConfirm: () => {
        startTransition(async () => {
          const result = await toggleUserActive(userId, !isActive)
          if (result.error) { toast.error(result.error); return }
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
          toast.success(isActive ? 'User deactivated' : 'User reactivated')
          router.refresh()
        })
      },
    })
  }

  // Bulk action handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filtered.map(u => u.id)))
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

  function handleBulkDeactivate() {
    setConfirmBulkDeactivate(true)
  }

  function doBulkDeactivate() {
    startTransition(async () => {
      const ids = Array.from(selectedIds)
      const errors: string[] = []
      
      for (const id of ids) {
        const result = await toggleUserActive(id, false)
        if (result.error) errors.push(`${id}: ${result.error}`)
      }
      
      if (errors.length > 0) {
        toast.error(`Failed to deactivate ${errors.length} user(s)`)
      } else {
        toast.success(`Deactivated ${ids.length} user(s)`)
        setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, is_active: false } : u))
        setSelectedIds(new Set())
        router.refresh()
      }
      setConfirmBulkDeactivate(false)
    })
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active)
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const columns = [
    {
      key: 'user',
      header: 'User',
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user.full_name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {user.full_name ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: User) => (
        <Badge className={ROLE_BADGE_STYLES[user.role]}>
          {ROLE_LABELS[user.role]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user: User) =>
        user.is_active ? (
          <Badge className="bg-[var(--badge-success-bg)] text-[var(--badge-success-fg)] border-0">
            Active
          </Badge>
        ) : (
          <Badge className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] border-0">
            Inactive
          </Badge>
        ),
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (user: User) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(user.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      stopPropagation: true,
      cell: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'admin')}
              disabled={user.role === 'admin'}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Set as Admin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'staff')}
              disabled={user.role === 'staff'}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Set as Staff
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'read_only')}
              disabled={user.role === 'read_only'}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Set as Read Only
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleToggleActive(user.id, user.is_active)}
              className={`gap-2 ${user.is_active ? 'text-destructive focus:text-destructive' : ''}`}
            >
              <UserX className="h-4 w-4" />
              {user.is_active ? 'Deactivate' : 'Reactivate'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect className="w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="read_only">Read Only</option>
          </FilterSelect>
          <FilterSelect className="w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
        </div>
        <Button className="gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new user</DialogTitle>
              <DialogDescription>
                They will receive an email invitation to set up their account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 pt-2">
              {inviteError && (
                <Alert variant="destructive" className="flex items-center gap-2 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{inviteError}</span>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="Full name"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole((v ?? 'staff') as UserRole)}
                  disabled={isPending}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="read_only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send invitation'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No users found."
        selectable={true}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
      />

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Deactivate',
            icon: UserX,
            onClick: handleBulkDeactivate,
            variant: 'destructive',
          },
        ]}
      />

      {pendingConfirm && (
        <ConfirmDialog
          open
          onOpenChange={(o) => { if (!o) setPendingConfirm(null) }}
          title={pendingConfirm.title}
          description={pendingConfirm.description}
          confirmLabel={pendingConfirm.confirmLabel}
          variant={pendingConfirm.variant}
          onConfirm={pendingConfirm.onConfirm}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDeactivate}
        onOpenChange={setConfirmBulkDeactivate}
        title={`Deactivate ${selectedIds.size} user(s)?`}
        description="These users will lose access to the platform immediately."
        confirmLabel="Deactivate All"
        variant="destructive"
        onConfirm={doBulkDeactivate}
      />
    </div>
  )
}
