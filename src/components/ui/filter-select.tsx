import * as React from 'react'
import { ChevronDown } from '@/components/icons'
import { cn } from '@/lib/utils'

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string
}

export function FilterSelect({ className, containerClassName, children, ...props }: FilterSelectProps) {
  return (
    <div className={cn('relative shrink-0', containerClassName)}>
      <select
        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-sm text-foreground outline-none transition-colors',
          'hover:bg-accent/50',
          'focus:border-ring focus:ring-3 focus:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
