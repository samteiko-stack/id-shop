import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type IconProps = HTMLAttributes<HTMLSpanElement> & {
  className?: string
}

type CreateIconOptions = {
  name: string
  filled?: boolean
  spin?: boolean
}

export function createMaterialIcon({ name, filled = false, spin = false }: CreateIconOptions) {
  function Icon({ className, style, ...props }: IconProps) {
    return (
      <span
        className={cn('material-symbols-outlined', spin && 'animate-spin', className)}
        style={{
          fontVariationSettings: filled
            ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          ...style,
        }}
        aria-hidden={props['aria-hidden'] ?? true}
        {...props}
      >
        {name}
      </span>
    )
  }

  Icon.displayName = `MaterialIcon(${name})`
  return Icon
}

/** Drop-in type for former Lucide icon components */
export type LucideIcon = ReturnType<typeof createMaterialIcon>
