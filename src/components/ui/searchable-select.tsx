'use client'

import * as React from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronDown, Search } from '@/components/icons'
import { cn } from '@/lib/utils'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
  /** @deprecated use description */
  sublabel?: string
  hint?: string
  /** Extra strings to match against when searching */
  keywords?: string[]
}

export type SearchableSelectProps = {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  contentClassName?: string
  renderValue?: (option: SearchableSelectOption) => React.ReactNode
  renderOption?: (
    option: SearchableSelectOption,
    state: { selected: boolean; highlighted: boolean },
  ) => React.ReactNode
}

function optionDescription(option: SearchableSelectOption) {
  return option.description ?? option.sublabel
}

function optionMatchesQuery(option: SearchableSelectOption, query: string) {
  const haystack = [
    option.label,
    optionDescription(option),
    option.hint,
    ...(option.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function DefaultOptionRow({ option }: { option: SearchableSelectOption }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate font-medium leading-snug">{option.label}</span>
        {option.hint && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {option.hint}
          </span>
        )}
      </div>
      {optionDescription(option) && (
        <p className="mt-0.5 truncate text-xs font-mono text-muted-foreground">
          {optionDescription(option)}
        </p>
      )}
    </div>
  )
}

const triggerClassName = cn(
  'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-colors outline-none select-none',
  'hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-placeholder:text-muted-foreground',
)

const popupClassName = cn(
  'z-50 flex w-(--anchor-width) min-w-(--anchor-width) origin-(--transform-origin) flex-col overflow-hidden rounded-lg',
  'bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
  'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
)

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  disabled = false,
  className,
  contentClassName,
  renderValue,
  renderOption,
}: SearchableSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Combobox.Root
      items={options}
      value={selected}
      onValueChange={(next) => onValueChange(next?.value ?? '')}
      disabled={disabled}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(option, query) => optionMatchesQuery(option, query)}
    >
      <Combobox.Trigger className={cn(triggerClassName, className)}>
        <Combobox.Value placeholder={placeholder}>
          {(item: SearchableSelectOption | null) =>
            item
              ? renderValue?.(item) ?? (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-foreground">{item.label}</span>
                    {optionDescription(item) && (
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        {optionDescription(item)}
                      </span>
                    )}
                  </span>
                )
              : null
          }
        </Combobox.Value>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground/70" />
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner align="start" side="bottom" sideOffset={4} positionMethod="fixed">
          <Combobox.Popup className={cn(popupClassName, contentClassName)}>
            <div className="border-b border-border p-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Combobox.Input
                  placeholder={searchPlaceholder}
                  className={cn(
                    'h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm text-foreground outline-none',
                    'placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  )}
                />
              </div>
            </div>

            <Combobox.Empty className="empty:hidden px-3 py-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </Combobox.Empty>

            <Combobox.List className="max-h-64 overflow-y-auto p-0.5 outline-none">
              {(option: SearchableSelectOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className={cn(
                    'flex w-full cursor-default items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none select-none',
                    'data-highlighted:bg-muted data-selected:bg-primary/5',
                  )}
                >
                  {renderOption ? (
                    renderOption(option, { selected: option.value === value, highlighted: false })
                  ) : (
                    <>
                      <DefaultOptionRow option={option} />
                      <Combobox.ItemIndicator className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                        <Check className="size-4 text-primary" />
                      </Combobox.ItemIndicator>
                    </>
                  )}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
