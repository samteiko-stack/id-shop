'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import type { NewsPost } from '@/types'
import { Calendar, Newspaper } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'

interface Props {
  posts: NewsPost[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function NyheterClient({ posts }: Props) {
  return (
    <div>
      <StorefrontPageHero
        eyebrow="ID Shop"
        title="Nyheter"
        description="Produktnyheter, branschuppdateringar och tips från ID Shop."
      />

      <StorefrontContainer pageSpacing>
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Inga nyheter publicerade ännu. Kom tillbaka snart.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/shop/nyheter/${post.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  {post.image_url ? (
                    <NextImage
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {post.published_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.published_at)}
                    </div>
                  )}
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </StorefrontContainer>
    </div>
  )
}
