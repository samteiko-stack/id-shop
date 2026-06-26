import Link from 'next/link'
import { ChevronRight, Home } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center flex-wrap gap-1 text-sm', className)}>
      <Link
        href="/shop"
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Hem"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {item.label.toUpperCase()}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
