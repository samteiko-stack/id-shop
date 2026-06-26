import { cn } from '@/lib/utils'
import {
  STOREFRONT_CONTAINER_CLASS,
  STOREFRONT_PAGE_SPACING,
} from '@/constants/storefront-layout'

type StorefrontContainerProps = {
  children: React.ReactNode
  /** Standard page content spacing below heroes — use on every main content block */
  pageSpacing?: boolean
  className?: string
  as?: 'div' | 'section' | 'main' | 'nav' | 'article'
}

/** Single max-width wrapper for all storefront content — aligns with header & footer. */
export function StorefrontContainer({
  children,
  pageSpacing = false,
  className,
  as: Tag = 'div',
}: StorefrontContainerProps) {
  return (
    <Tag
      className={cn(
        STOREFRONT_CONTAINER_CLASS,
        pageSpacing && STOREFRONT_PAGE_SPACING,
        className,
      )}
    >
      {children}
    </Tag>
  )
}
