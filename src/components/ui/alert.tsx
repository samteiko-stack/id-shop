import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        default:     'bg-card border-border text-foreground',
        info:        'bg-primary/5 border-primary/20 text-foreground',
        success:     'bg-[var(--badge-success-bg)] border-[var(--badge-success-fg)]/20 text-foreground',
        warning:     'bg-warning/10 border-warning/30 text-foreground',
        destructive: 'bg-destructive/5 border-destructive/20 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const iconColor: Record<string, string> = {
  default:     'text-muted-foreground',
  info:        'text-primary',
  success:     'text-[var(--badge-success-fg)]',
  warning:     'text-warning',
  destructive: 'text-destructive',
}

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      data-variant={variant}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertIcon({ className, variant, ...props }: React.ComponentProps<'div'> & { variant?: string }) {
  return (
    <div
      data-slot="alert-icon"
      className={cn('mt-0.5 shrink-0 [&_svg]:size-4', variant ? iconColor[variant] : 'text-muted-foreground', className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('font-semibold leading-snug', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-sm text-muted-foreground mt-0.5', className)}
      {...props}
    />
  )
}

export { Alert, AlertIcon, AlertTitle, AlertDescription, alertVariants }
