import type { ReactNode } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { ArrowLeft } from '@/components/icons'
import { cn } from '@/lib/utils'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import {
  STOREFRONT_EDITORIAL_WIDTH,
  STOREFRONT_EDITORIAL_WIDTH_WIDE,
  STOREFRONT_EDITORIAL_IMAGE_ASPECT,
  STOREFRONT_TEXT_SIZE_MEDIUM,
} from '@/constants/storefront-layout'

type EditorialImage = {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
}

type StorefrontEditorialPageProps = {
  backLink: { href: string; label: string }
  title: string
  lead?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  image?: EditorialImage
  children: ReactNode
  className?: string
  /** Use `wide` for course pages with a signup sidebar */
  width?: 'default' | 'wide'
}

/** Simple article / education page — title, optional image, then content on white background */
export function StorefrontEditorialPage({
  backLink,
  title,
  lead,
  description,
  meta,
  image,
  children,
  className,
  width = 'default',
}: StorefrontEditorialPageProps) {
  const columnWidth =
    width === 'wide' ? STOREFRONT_EDITORIAL_WIDTH_WIDE : STOREFRONT_EDITORIAL_WIDTH

  return (
    <div>
      <StorefrontContainer as="article" pageSpacing className={className}>
        <div className={cn('mx-auto w-full', columnWidth)}>
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>

          <header className="space-y-4">
            {lead}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className={cn('text-muted-foreground', STOREFRONT_TEXT_SIZE_MEDIUM)}>
                {description}
              </p>
            )}
            {meta}
          </header>

          {image && (
            <div
              className={cn(
                'relative mt-10 mb-12 w-full overflow-hidden rounded-xl border border-border bg-muted',
                STOREFRONT_EDITORIAL_IMAGE_ASPECT,
              )}
            >
              <NextImage
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes={image.sizes ?? '(max-width: 672px) 100vw, 672px'}
                priority={image.priority}
              />
            </div>
          )}

          {children}
        </div>
      </StorefrontContainer>
    </div>
  )
}
