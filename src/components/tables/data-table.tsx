'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const selectionColumnClass = 'w-12 min-w-12 max-w-12 px-4'
const selectionCellClass = 'flex size-[18px] items-center justify-center'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  stopPropagation?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  // Bulk selection
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectAll?: (checked: boolean) => void
  onSelectRow?: (id: string, checked: boolean) => void
  rowClassName?: (row: T) => string | undefined
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No results found.',
  onRowClick,
  selectable = false,
  selectedIds = new Set(),
  onSelectAll,
  onSelectRow,
  rowClassName,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every(row => selectedIds.has(row.id))
  const someSelected = data.some(row => selectedIds.has(row.id)) && !allSelected
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--table-header-bg)] hover:bg-[var(--table-header-bg)]">
            {selectable && (
              <TableHead className={selectionColumnClass}>
                <div className={selectionCellClass}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => onSelectAll?.(!!checked)}
                    aria-label="Select all"
                  />
                </div>
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  'text-xs font-semibold text-[var(--table-header-fg)] uppercase tracking-wide h-10 px-4',
                  col.className
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell className={selectionColumnClass}>
                    <div className={selectionCellClass}>
                      <Skeleton className="size-[18px] rounded-[5px]" />
                    </div>
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="text-center py-12 text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const isSelected = selectedIds.has(row.id)
              return (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-border transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[var(--table-row-hover)] [&_*]:cursor-pointer',
                    isSelected && 'bg-[var(--table-row-selected)]',
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <TableCell className={cn(selectionColumnClass, 'py-4')} onClick={(e) => e.stopPropagation()}>
                      <div className={selectionCellClass}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onSelectRow?.(row.id, !!checked)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </div>
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn('px-4 py-4 align-middle', col.className)}
                      onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
