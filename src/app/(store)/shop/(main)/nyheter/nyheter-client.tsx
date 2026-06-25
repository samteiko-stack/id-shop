'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import type { NewsPost } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Newspaper, Search, X } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'

interface Props {
  posts: NewsPost[]
}

type SortOrder = 'newest' | 'oldest'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function NyheterClient({ posts }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('newest')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const matches = posts.filter((post) => {
      if (!search) return true
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q)
      )
    })

    return [...matches].sort((a, b) => {
      const aTime = a.published_at ? new Date(a.published_at).getTime() : 0
      const bTime = b.published_at ? new Date(b.published_at).getTime() : 0
      return sort === 'newest' ? bTime - aTime : aTime - bTime
    })
  }, [posts, search, sort])

  const hasFilters = search !== '' || sort !== 'newest'

  function clearFilters() {
    setSearch('')
    setSort('newest')
  }

  return (
    <div>
      <StorefrontPageHero
        eyebrow="Aktuellt"
        title="Nyheter"
        description="Produktnyheter, branschuppdateringar och tips för kliniker och tandvårdsteam."
      />

      <StorefrontContainer pageSpacing>
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök nyheter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="newest">Senaste först</option>
              <option value="oldest">Äldsta först</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Rensa filter
              </Button>
            )}

            <p className="text-sm text-muted-foreground ml-auto">
              <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'artikel' : 'artiklar'}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-base font-semibold text-foreground">
              {posts.length === 0 ? 'Inga nyheter publicerade ännu' : 'Inga nyheter hittades'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {posts.length === 0
                ? 'Kom tillbaka snart för uppdateringar från ID Shop.'
                : 'Prova att justera din sökning'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </StorefrontContainer>
    </div>
  )
}

function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/shop/nyheter/${post.slug}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-ring/40"
    >
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {post.image_url ? (
          <NextImage
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Newspaper className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {post.published_at && (
          <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-xs font-semibold">
            {formatShortDate(post.published_at)}
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Nyhet
          </Badge>
        </div>

        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          {post.published_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(post.published_at)}</span>
            </div>
          )}
          {post.excerpt && (
            <p className="line-clamp-2 leading-relaxed">{post.excerpt}</p>
          )}
        </div>

        <Button variant="outline" className="w-full mt-4">
          Visa detaljer
        </Button>
      </div>
    </Link>
  )
}
