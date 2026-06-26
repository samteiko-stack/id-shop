import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { WavyLinesCanvas } from './wavy-lines-canvas'

type BrandSurfaceProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'footer' | 'article' | 'aside'
  /** Wavy line animation — off for footer and other repeated surfaces */
  waves?: boolean
  /** Footer uses an upward-facing gradient so it reads differently from nav/hero surfaces */
  variant?: 'default' | 'footer'
}

export function BrandSurface({
  children,
  className,
  as: Tag = 'div',
  waves = true,
  variant = 'default',
}: BrandSurfaceProps) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden text-white',
        variant === 'footer' ? 'storefront-brand-surface-footer' : 'storefront-brand-surface',
        className,
      )}
    >
      {waves ? <WavyLinesCanvas /> : null}
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          variant === 'footer' ? 'storefront-brand-surface-footer-glow' : 'storefront-brand-surface-glow',
        )}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col h-full min-h-0">{children}</div>
    </Tag>
  )
}
