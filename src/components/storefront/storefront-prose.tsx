import { cn } from '@/lib/utils'
import { toArticleHtml } from '@/lib/sanitize-html'
import { STOREFRONT_MAX_WIDTH_LARGE } from '@/constants/storefront-layout'

interface StorefrontProseProps {
  children: string
  className?: string
  /** When set, skips a leading H2 that repeats this title (shown in page hero) */
  omitTitle?: string
}

export function StorefrontProse({ children, className, omitTitle }: StorefrontProseProps) {
  const html = toArticleHtml(children, { omitTitle })

  return (
    <div
      className={cn('storefront-prose', STOREFRONT_MAX_WIDTH_LARGE, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
