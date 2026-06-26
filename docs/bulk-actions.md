# Bulk Actions System

A flexible, extensible system for adding bulk actions to admin list pages without rebuilding components.

## Quick Start

### 1. Import the helpers

```tsx
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar'
import { createArchiveAction, createExportAction, createEmailAction } from '@/lib/bulk-actions'
```

### 2. Add state for selection

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

function handleSelectAll(checked: boolean) {
  if (checked) {
    setSelectedIds(new Set(data.map(item => item.id)))
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
```

### 3. Update your DataTable

```tsx
<DataTable
  columns={columns}
  data={data}
  selectable={true}
  selectedIds={selectedIds}
  onSelectAll={handleSelectAll}
  onSelectRow={handleSelectRow}
/>
```

### 4. Add the BulkActionsBar

```tsx
<BulkActionsBar
  selectedCount={selectedIds.size}
  onClearSelection={() => setSelectedIds(new Set())}
  actions={[
    createArchiveAction(handleBulkArchive),
    createExportAction(handleBulkExport),
  ]}
/>
```

## Adding New Actions

### Using Presets

The easiest way is to use the built-in action creators:

```tsx
import { 
  createDeleteAction,
  createArchiveAction,
  createExportAction,
  createEmailAction,
  createTagAction,
  createDuplicateAction,
  createBulkEditAction,
  createApproveAction,
  createRejectAction,
  createActivateAction,
} from '@/lib/bulk-actions'

const actions = [
  createArchiveAction(handleArchive),
  createExportAction(handleExport),
  createEmailAction(handleEmail),
]
```

### Creating Custom Actions

For unique actions, use the inline syntax:

```tsx
import { Star } from 'lucide-react'

const actions = [
  {
    label: 'Add to Favorites',
    icon: Star,
    onClick: handleBulkFavorite,
    variant: 'default',
  },
  {
    label: 'Send Notification',
    icon: Bell,
    onClick: handleBulkNotify,
  },
]
```

### Conditional Actions

Show actions based on permissions or state:

```tsx
const actions = [
  createArchiveAction(handleArchive),
  ...(canExport ? [createExportAction(handleExport)] : []),
  ...(isAdmin ? [createDeleteAction(handleDelete)] : []),
]
```

## Available Action Presets

| Function | Use Case | Variant |
|----------|----------|---------|
| `createDeleteAction` | Permanently delete items | destructive |
| `createArchiveAction` | Soft delete / hide items | destructive |
| `createExportAction` | Export to CSV/PDF | default |
| `createEmailAction` | Send bulk emails | default |
| `createTagAction` | Add tags/labels | default |
| `createDuplicateAction` | Clone items | default |
| `createBulkEditAction` | Batch edit properties | default |
| `createApproveAction` | Approve pending items | default |
| `createRejectAction` | Reject pending items | destructive |
| `createActivateAction` | Enable/disable items | varies |

## Action Properties

```tsx
interface BulkAction {
  label: string              // Button text
  icon?: React.ElementType   // Lucide icon component
  onClick: () => void        // Handler function
  variant?: 'default' | 'destructive'  // Visual style
  disabled?: boolean         // Disable button
}
```

## Best Practices

1. **Always show confirmation dialogs** for destructive actions:
   ```tsx
   function handleBulkDelete() {
     setConfirmBulkDelete(true)
   }
   ```

2. **Clear selection after success**:
   ```tsx
   toast.success('Items archived')
   setSelectedIds(new Set())
   ```

3. **Handle errors gracefully**:
   ```tsx
   if (errors.length > 0) {
     toast.error(`Failed to archive ${errors.length} item(s)`)
   }
   ```

4. **Update state or refresh**:
   ```tsx
   setData(prev => prev.filter(item => !selectedIds.has(item.id)))
   // or
   router.refresh()
   ```

## Examples

### Simple Archive + Export

```tsx
<BulkActionsBar
  selectedCount={selectedIds.size}
  onClearSelection={() => setSelectedIds(new Set())}
  actions={[
    createArchiveAction(handleBulkArchive),
    createExportAction(handleBulkExport),
  ]}
/>
```

### Approval Workflow

```tsx
<BulkActionsBar
  selectedCount={selectedIds.size}
  onClearSelection={() => setSelectedIds(new Set())}
  actions={[
    createApproveAction(handleBulkApprove),
    createRejectAction(handleBulkReject),
  ]}
/>
```

### Admin with Multiple Actions

```tsx
<BulkActionsBar
  selectedCount={selectedIds.size}
  onClearSelection={() => setSelectedIds(new Set())}
  actions={[
    createBulkEditAction(handleBulkEdit),
    createTagAction(handleBulkTag),
    createExportAction(handleBulkExport),
    createArchiveAction(handleBulkArchive),
  ]}
/>
```

## Adding New Preset Actions

To add a new preset action to the library:

1. Add it to `/src/lib/bulk-actions.ts`:

```tsx
import { YourIcon } from 'lucide-react'

export function createYourAction(onClick: () => void, disabled = false): BulkAction {
  return {
    label: 'Your Action',
    icon: YourIcon,
    onClick,
    variant: 'default',
    disabled,
  }
}
```

2. Use it anywhere:

```tsx
import { createYourAction } from '@/lib/bulk-actions'

const actions = [createYourAction(handleYourAction)]
```

That's it! No need to modify any components.
