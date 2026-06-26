'use client'

import type { NewsPost } from '@/types'
import { Calendar } from '@/components/icons'
import { StorefrontEditorialPage } from '@/components/storefront/storefront-editorial-page'
import { StorefrontProse } from '@/components/storefront/storefront-prose'

interface Props {
  post: NewsPost
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function NewsDetailClient({ post }: Props) {
  return (
    <StorefrontEditorialPage
      backLink={{ href: '/shop/nyheter', label: 'Tillbaka till nyheter' }}
      title={post.title}
      description={post.excerpt}
      meta={
        post.published_at ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at)}
          </p>
        ) : undefined
      }
      image={
        post.image_url
          ? { src: post.image_url, alt: post.title, priority: true }
          : undefined
      }
    >
      <StorefrontProse omitTitle={post.title}>{post.body}</StorefrontProse>
    </StorefrontEditorialPage>
  )
}
