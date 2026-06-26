'use client'

import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min?: number
  className?: string
}

export function QuantityStepper({ value, onChange, disabled = false, min = 1, className }: Props) {
  const digits = Math.max(3, String(value).length)

  return (
    <div
      className={cn(
        'flex h-11 min-h-11 w-fit max-w-fit shrink-0 items-stretch overflow-hidden rounded-lg border border-input bg-background',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled}
        aria-label="Minska antal"
        className="flex h-full w-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-sm leading-none">−</span>
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
        disabled={disabled}
        aria-label="Antal"
        style={{ width: `${digits + 1}ch` }}
        className="h-full min-h-11 max-w-[7ch] shrink-0 border-x border-input bg-transparent px-1 text-center text-sm font-semibold tabular-nums focus:bg-accent/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Öka antal"
        className="flex h-full w-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-sm leading-none">+</span>
      </button>
    </div>
  )
}
