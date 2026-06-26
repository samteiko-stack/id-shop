/**
 * Bulk Actions Utilities
 * 
 * Provides helper functions to create common bulk actions without rebuilding components.
 * Import these helpers and customize as needed for your specific use case.
 * 
 * @example
 * ```tsx
 * import { createArchiveAction, createExportAction } from '@/lib/bulk-actions'
 * 
 * const actions = [
 *   createArchiveAction(handleBulkArchive),
 *   createExportAction(handleBulkExport),
 * ]
 * ```
 */

import { 
  Trash2, 
  Archive, 
  Download, 
  Mail, 
  Tag, 
  Copy, 
  Edit,
  CheckCircle,
  XCircle,
  Power
} from '@/components/icons'
import type { BulkAction } from '@/components/ui/bulk-actions-bar'

/**
 * Creates a bulk delete action.
 * Use for permanently deleting items.
 */
export function createDeleteAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Delete',
    icon: Trash2,
    onClick,
    variant: 'destructive',
    disabled,
  }
}

/**
 * Creates a bulk archive action.
 * Use for soft-deleting or hiding items.
 */
export function createArchiveAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Archive',
    icon: Archive,
    onClick,
    variant: 'destructive',
    disabled,
  }
}

/**
 * Creates a bulk export action.
 * Use for exporting selected items to CSV, PDF, etc.
 */
export function createExportAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Export',
    icon: Download,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk email action.
 * Use for sending emails to selected users/customers.
 */
export function createEmailAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Send Email',
    icon: Mail,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk tag/label action.
 * Use for adding tags or labels to selected items.
 */
export function createTagAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Add Tag',
    icon: Tag,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk duplicate action.
 * Use for cloning selected items.
 */
export function createDuplicateAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Duplicate',
    icon: Copy,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk edit action.
 * Use for batch editing properties of selected items.
 */
export function createBulkEditAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Edit',
    icon: Edit,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk approve action.
 * Use for approving pending items.
 */
export function createApproveAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Approve',
    icon: CheckCircle,
    onClick,
    variant: 'default',
    disabled,
  }
}

/**
 * Creates a bulk reject action.
 * Use for rejecting pending items.
 */
export function createRejectAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Reject',
    icon: XCircle,
    onClick,
    variant: 'destructive',
    disabled,
  }
}

/**
 * Creates a bulk activate/deactivate action.
 * Use for enabling/disabling items.
 */
export function createActivateAction(onClick: () => void, isActivate = true, disabled = false): BulkAction {
  return {
    label: isActivate ? 'Activate' : 'Deactivate',
    icon: Power,
    onClick,
    variant: isActivate ? 'default' : 'destructive',
    disabled,
  }
}

/**
 * Creates a custom bulk action.
 * Use when none of the presets fit your needs.
 * 
 * @example
 * ```tsx
 * import { createCustomAction } from '@/lib/bulk-actions'
 * import { Star } from '@/components/icons'
 * 
 * const favoriteAction = createCustomAction({
 *   label: 'Add to Favorites',
 *   icon: Star,
 *   onClick: handleBulkFavorite,
 * })
 * ```
 */
export function createCustomAction(action: BulkAction): BulkAction {
  return action
}
