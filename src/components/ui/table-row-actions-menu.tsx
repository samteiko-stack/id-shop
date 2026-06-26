'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { MoreHorizontal } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Matches admin data-table row actions (Products, News, Programs, …) */
export const TABLE_ROW_ACTIONS_TRIGGER_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors'

export type TableRowAction = {
  label: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  target?: string
  variant?: 'default' | 'destructive'
  show?: boolean
}

interface TableRowActionsMenuProps {
  items: TableRowAction[]
  align?: 'start' | 'end' | 'center'
  disabled?: boolean
}

export function TableRowActionsMenu({
  items,
  align = 'end',
  disabled,
}: TableRowActionsMenuProps) {
  const visible = items.filter((item) => item.show !== false)
  if (visible.length === 0) return null

  const regular = visible.filter((item) => item.variant !== 'destructive')
  const destructive = visible.filter((item) => item.variant === 'destructive')

  function renderAction(item: TableRowAction, key: string) {
    const label = (
      <>
        {item.icon}
        {item.label}
      </>
    )

    if (item.href) {
      return (
        <DropdownMenuItem
          key={key}
          variant={item.variant}
          className="gap-2"
          render={
            <Link
              href={item.href}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            />
          }
        >
          {label}
        </DropdownMenuItem>
      )
    }

    return (
      <DropdownMenuItem
        key={key}
        variant={item.variant}
        className="gap-2"
        onClick={item.onClick}
      >
        {label}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={TABLE_ROW_ACTIONS_TRIGGER_CLASS}
        disabled={disabled}
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {regular.map((item, index) => renderAction(item, `action-${index}`))}
        {regular.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((item, index) => renderAction(item, `destructive-${index}`))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
