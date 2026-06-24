'use client'

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/searchable-select'
import { formatCurrency } from '@/lib/utils'

export type ProductOption = {
  id: string
  name: string
  ref: string
  unit_price?: number
  currency?: string
}

interface ProductSelectProps {
  products: ProductOption[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  showPrice?: boolean
}

function toProductOptions(
  products: ProductOption[],
  showPrice: boolean,
): SearchableSelectOption[] {
  return products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.ref,
    hint:
      showPrice && product.unit_price != null
        ? formatCurrency(product.unit_price, product.currency ?? 'EUR')
        : undefined,
    keywords: [product.ref, product.name],
  }))
}

/** Searchable product picker for orders and sales forms. */
export function ProductSelect({
  products,
  value,
  onValueChange,
  disabled,
  className,
  placeholder = 'Select product',
  showPrice = true,
}: ProductSelectProps) {
  return (
    <SearchableSelect
      options={toProductOptions(products, showPrice)}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search by name or REF…"
      emptyMessage="No products found."
      disabled={disabled}
      className={className}
    />
  )
}

/** @deprecated Use ProductSelect */
export const ProductCombobox = ProductSelect

export { toProductOptions }
