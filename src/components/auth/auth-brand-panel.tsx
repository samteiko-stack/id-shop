import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandSurface } from '@/components/storefront/brand-surface'
import { cn } from '@/lib/utils'

type AuthBrandPanelProps = {
  children: ReactNode
  className?: string
  footer?: string
  logoHref?: string
}

export function AuthBrandPanel({
  children,
  className,
  footer,
  logoHref = '/shop',
}: AuthBrandPanelProps) {
  const year = new Date().getFullYear()

  return (
    <BrandSurface
      as="aside"
      className={cn('hidden lg:flex min-h-dvh p-12 shrink-0', className)}
    >
      <div className="flex h-full min-h-0 flex-col justify-between">
        <Link href={logoHref}>
          <img src="/logo-white.png" alt="Infinity Dental" className="h-8 w-auto" />
        </Link>

        <div>{children}</div>

        <p className="text-[11px] text-white/40">
          {footer ?? `© ${year} ID Shop`}
        </p>
      </div>
    </BrandSurface>
  )
}

export function AuthBrandHeadline({
  title,
  accent,
  description,
}: {
  title: ReactNode
  accent: ReactNode
  description: string
}) {
  return (
    <>
      <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
        {title}
        <br />
        <span className="text-primary">{accent}</span>
      </h2>
      <p className="mt-4 text-white/55 text-sm leading-relaxed max-w-sm">
        {description}
      </p>
    </>
  )
}
