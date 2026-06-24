'use client'

import { X } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Represents a single bulk action that can be performed on selected items.
 * 
 * @example
 * ```tsx
 * const deleteAction: BulkAction = {
 *   label: 'Delete',
 *   icon: Trash2,
 *   onClick: handleBulkDelete,
 *   variant: 'destructive',
 * }
 * ```
 */
export interface BulkAction {
  /** Display label for the action button */
  label: string
  /** Optional Lucide icon component */
  icon?: React.ElementType
  /** Callback function when action is clicked */
  onClick: () => void
  /** Visual style variant - 'destructive' for dangerous actions */
  variant?: 'default' | 'destructive'
  /** Disable the action button */
  disabled?: boolean
}

/**
 * Props for the BulkActionsBar component.
 * 
 * @example
 * ```tsx
 * <BulkActionsBar
 *   selectedCount={selectedIds.size}
 *   onClearSelection={() => setSelectedIds(new Set())}
 *   actions={[
 *     { label: 'Archive', icon: Archive, onClick: handleArchive },
 *     { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
 *     { label: 'Export', icon: Download, onClick: handleExport },
 *   ]}
 * />
 * ```
 */
interface BulkActionsBarProps {
  /** Number of items currently selected */
  selectedCount: number
  /** Callback to clear all selections */
  onClearSelection: () => void
  /** Array of actions to display - supports any number of actions */
  actions: BulkAction[]
  /** Optional additional CSS classes */
  className?: string
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50',
        'w-[calc(100%-2rem)] sm:w-auto sm:max-w-fit',
        'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4',
        'px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl',
        'bg-neutral-900 text-white shadow-2xl border border-neutral-700',
        'animate-in fade-in-0 slide-in-from-top-4 duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between sm:justify-start gap-2.5">
        <p className="text-sm font-semibold tabular-nums">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </p>
        <button
          onClick={onClearSelection}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors shrink-0"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="hidden sm:block h-6 w-px bg-white/20" />

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              size="sm"
              className={cn(
                'h-8 gap-1.5 font-medium flex-1 sm:flex-none',
                action.variant === 'destructive' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-0'
              )}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
