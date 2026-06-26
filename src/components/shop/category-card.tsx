import Link from 'next/link'
import NextImage from 'next/image'
import { ChevronRight } from '@/components/icons'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  href: string
  imageUrl?: string | null
  subtitle?: string
  className?: string
}

export function CategoryCard({ name, href, imageUrl, subtitle, className }: Props) {
  const initial = name.charAt(0).toUpperCase()

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/[0.04] hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full',
        className
      )}
    >
      {/* Image / initial */}
      <div className="relative flex items-center justify-center h-44 overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/10 via-primary-subtle to-muted/70">
        {imageUrl ? (
          <>
            <NextImage
              src={imageUrl}
              alt={name}
              width={120}
              height={120}
              className="object-contain w-full h-full p-8 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.06] via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-card shadow-md ring-1 ring-primary/15 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-primary/30">
            <span className="font-black text-primary text-4xl leading-none select-none">
              {initial}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 border-t border-border/80 bg-card rounded-b-xl">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
