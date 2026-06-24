'use client'

export {
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectProps,
} from '@/components/ui/searchable-select'

/** @deprecated Use SearchableSelectOption */
export type ComboboxOption = import('@/components/ui/searchable-select').SearchableSelectOption

import {
  SearchableSelect,
  type SearchableSelectOption,
  type SearchableSelectProps,
} from '@/components/ui/searchable-select'

/** @deprecated Use SearchableSelect */
export function Combobox({
  options,
  ...props
}: SearchableSelectProps & {
  options: (SearchableSelectOption & { sublabel?: string })[]
}) {
  return (
    <SearchableSelect
      options={options.map(({ sublabel, ...option }) => ({
        ...option,
        description: option.description ?? sublabel,
      }))}
      {...props}
    />
  )
}
