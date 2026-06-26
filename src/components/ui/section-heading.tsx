import { cn } from '@/lib/utils'
import {
  STOREFRONT_MAX_WIDTH_LARGE,
  STOREFRONT_MAX_WIDTH_XLARGE,
} from '@/constants/storefront-layout'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', className }: SectionHeadingProps) {
  return (
    <div className={cn(align === 'center' && 'text-center mx-auto', className)}>
      {eyebrow && (
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'text-3xl font-extrabold tracking-tight text-foreground leading-tight',
          STOREFRONT_MAX_WIDTH_XLARGE,
          align === 'center' && 'mx-auto',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-3 text-base font-medium text-foreground/75 leading-relaxed',
            STOREFRONT_MAX_WIDTH_LARGE,
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
