'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CategoryCard } from '@/components/shop/category-card'

export type CategoryStripItem = {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

type CategoryStripProps = {
  categories: CategoryStripItem[]
  className?: string
}

/** Horizontal category row — same cards as homepage, scrolls within the storefront container */
export function CategoryStrip({ categories, className }: CategoryStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [categories, updateScrollState])

  function scrollBy(direction: 'left' | 'right') {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.85, 280)
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (categories.length === 0) return null

  return (
    <div className={cn('relative w-full overflow-visible', className)}>
      {canScrollLeft && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Scroll categories left"
          onClick={() => scrollBy('left')}
          className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-card shadow-md ring-1 ring-border lg:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Scroll categories right"
          onClick={() => scrollBy('right')}
          className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-card shadow-md ring-1 ring-border lg:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Track — vertical padding keeps shadows / hover lift inside the scrollport */}
      <div className="relative overflow-visible py-3">
        <div
          className={cn(
            'pointer-events-none absolute top-3 bottom-3 left-0 z-[1] w-6 bg-gradient-to-r from-background to-transparent transition-opacity lg:w-10',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute top-3 bottom-3 right-0 z-[1] w-6 bg-gradient-to-r from-transparent to-background transition-opacity lg:w-10',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
        />

        <div
          ref={scrollerRef}
          className="flex w-full gap-4 overflow-x-auto overflow-y-visible scroll-smooth scrollbar-hide snap-x snap-mandatory px-1 py-2"
        >
          {categories.map(cat => (
            <div
              key={cat.id}
              className="w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            >
              <CategoryCard
                name={cat.name}
                href={`/shop/kategori/${cat.slug}`}
                imageUrl={cat.image_url}
                className="hover:!translate-y-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
