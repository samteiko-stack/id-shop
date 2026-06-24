import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import { cn } from '@/lib/utils'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import {
  STOREFRONT_MAX_WIDTH_LARGE,
  STOREFRONT_MAX_WIDTH_XLARGE,
  STOREFRONT_TEXT_SIZE_MEDIUM,
  STOREFRONT_HERO_SPACING,
} from '@/constants/storefront-layout'
import { BrandSurface } from './brand-surface'

type StorefrontPageHeroProps = {
  title: ReactNode
  description?: ReactNode
  eyebrow?: string
  align?: 'left' | 'center'
  className?: string
  children?: ReactNode
  backLink?: { href: string; label: string }
  /** Content between back link and title (e.g. date, badges) */
  lead?: ReactNode
  /** Content directly after the title (e.g. course metadata) */
  afterTitle?: ReactNode
  /** Optional right column — enables split layout when provided */
  media?: ReactNode
}

export function StorefrontPageHero({
  title,
  description,
  eyebrow,
  align = 'left',
  className,
  children,
  backLink,
  lead,
  afterTitle,
  media,
}: StorefrontPageHeroProps) {
  const titleEl = (
    <h1
      className={cn(
        'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white',
        !media && STOREFRONT_MAX_WIDTH_XLARGE,
        align === 'center' && 'mx-auto',
      )}
    >
      {title}
    </h1>
  )

  const descriptionEl =
    description && (
      <div
        className={cn(
          'mt-5 text-white/70',
          STOREFRONT_TEXT_SIZE_MEDIUM,
          !media && STOREFRONT_MAX_WIDTH_LARGE,
          align === 'center' && 'mx-auto',
        )}
      >
        {description}
      </div>
    )

  const mainContent = (
    <>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90 mb-3">
          {eyebrow}
        </p>
      )}

      {lead}

      {titleEl}

      {afterTitle}

      {descriptionEl}

      {children && (
        <div className={cn('mt-8', STOREFRONT_MAX_WIDTH_LARGE, align === 'center' && 'mx-auto')}>
          {children}
        </div>
      )}
    </>
  )

  return (
    <BrandSurface as="section" className={cn('border-b border-white/10', className)}>
      <StorefrontContainer className={align === 'center' ? 'text-center' : undefined}>
        <div
          className={cn(
            STOREFRONT_HERO_SPACING,
            align === 'center' && 'text-center',
          )}
        >
          {backLink && (
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
          )}

          {media ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">{mainContent}</div>
              {media}
            </div>
          ) : (
            mainContent
          )}
        </div>
      </StorefrontContainer>
    </BrandSurface>
  )
}
