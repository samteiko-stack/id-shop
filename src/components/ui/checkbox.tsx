'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from '@/components/icons'
import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean
  }
>(({ className, indeterminate, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={indeterminate ? 'indeterminate' : checked}
    className={cn(
      'peer size-[18px] shrink-0 rounded-[5px] border border-input bg-background shadow-xs',
      'transition-[color,box-shadow,background-color,border-color] duration-150',
      'hover:border-ring/60 hover:bg-muted/40',
      'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {indeterminate ? (
        <Minus className="size-3.5 stroke-[2.5]" />
      ) : (
        <Check className="size-3.5 stroke-[2.5]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
