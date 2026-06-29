'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, LogOut, User, Menu, X, ChevronDown, Grid3X3, LayoutDashboard } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { StorefrontContainer } from '@/components/layout/storefront-container'

interface TopCategory {
  id: string
  name: string
  slug: string
}

interface Props {
  customer: { id: string; email: string; name?: string; isApproved: boolean } | null
  showAdminLink?: boolean
  cartCount: number
  topCategories?: TopCategory[]
}

export function ShopHeader({ customer, showAdminLink = false, cartCount, topCategories = [] }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sortimentOpen, setSortimentOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/shop/login'
  }

  const isSortiment =
    pathname.startsWith('/shop') &&
    !pathname.startsWith('/shop/programs') &&
    !pathname.startsWith('/shop/om-oss') &&
    !pathname.startsWith('/shop/nyheter') &&
    !pathname.startsWith('/shop/konto') &&
    pathname !== '/shop/login' &&
    pathname !== '/shop/register' &&
    pathname !== '/shop/pending' &&
    pathname !== '/shop/cart'

  return (
    <>
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <StorefrontContainer>
          <div className="flex h-16 items-center gap-8">

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <img src="/logo-blue.png" alt="Infinity Dental" className="h-8 w-auto" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Sortiment dropdown — opens on hover (desktop) */}
              <div
                className="relative"
                onMouseEnter={() => setSortimentOpen(true)}
                onMouseLeave={() => setSortimentOpen(false)}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors relative',
                    isSortiment ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Sortiment
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200 ease-out', sortimentOpen && 'rotate-180')} />
                  {isSortiment && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary" />}
                </button>

                {sortimentOpen && (
                  <div className="absolute top-full left-0 pt-1 w-64 z-50">
                    <div className="animate-nav-dropdown rounded-xl border border-border bg-card shadow-lg py-2">
                    {/* All products link */}
                    <Link
                      href="/shop"
                      onClick={() => setSortimentOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors font-medium"
                    >
                      <Grid3X3 className="h-4 w-4 text-primary" />
                      Alla produkter
                    </Link>

                    {topCategories.length > 0 && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Kategorier
                        </p>
                        {topCategories.map(cat => (
                          <Link
                            key={cat.id}
                            href={`/shop/kategori/${cat.slug}`}
                            onClick={() => setSortimentOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                              pathname.startsWith(`/shop/kategori/${cat.slug}`)
                                ? 'text-primary font-semibold bg-primary/5'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0">
                              {cat.name.charAt(0)}
                            </span>
                            {cat.name}
                          </Link>
                        ))}
                        <div className="my-1 border-t border-border" />
                        <Link
                          href="/shop/kategori"
                          onClick={() => setSortimentOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Visa alla kategorier →
                        </Link>
                      </>
                    )}
                    </div>
                  </div>
                )}
              </div>

              {/* Program */}
              <Link
                href="/shop/programs"
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  pathname.startsWith('/shop/programs') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Program
                {pathname.startsWith('/shop/programs') && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary" />
                )}
              </Link>

              {/* Nyheter */}
              <Link
                href="/shop/nyheter"
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  pathname.startsWith('/shop/nyheter') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Nyheter
                {pathname.startsWith('/shop/nyheter') && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary" />
                )}
              </Link>

              {/* Om oss */}
              <Link
                href="/shop/om-oss"
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  pathname.startsWith('/shop/om-oss') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Om oss
                {pathname.startsWith('/shop/om-oss') && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary" />
                )}
              </Link>
            </nav>

            {/* Spacer — pushes account + actions to the right on desktop */}
            <div className="hidden md:block flex-1" />

            {/* Spacer for mobile */}
            <div className="flex-1 md:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {customer ? (
                <>
                  <ButtonLink
                    href="/shop/konto"
                    variant={pathname.startsWith('/shop/konto') ? 'default' : 'outline'}
                    className="gap-2 font-medium"
                    aria-label="Mitt konto"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Mitt konto</span>
                  </ButtonLink>

                  {customer.isApproved && (
                    <ButtonLink href="/shop/cart" variant="outline" className="relative gap-2 font-medium">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">Varukorg</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                          {cartCount}
                        </span>
                      )}
                    </ButtonLink>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-muted-foreground gap-2"
                    title="Logga ut"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Logga ut</span>
                  </Button>
                </>
              ) : showAdminLink ? (
                <>
                  <ButtonLink href="/dashboard" variant="outline" className="gap-2 font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-muted-foreground gap-2"
                    title="Logga ut"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Logga ut</span>
                  </Button>
                </>
              ) : (
                <>
                  <ButtonLink href="/shop/register" variant="ghost" className="gap-2 text-muted-foreground font-medium hidden sm:flex">
                    <User className="h-4 w-4" />
                    Registrera
                  </ButtonLink>
                  <ButtonLink href="/shop/login" className="font-semibold">
                    Logga in som företag
                  </ButtonLink>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </StorefrontContainer>

      </header>

      {/* Mobile menu — fixed so it never shifts page content */}
      {mobileOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 border-b border-border bg-card shadow-lg">
          <StorefrontContainer className="py-4 space-y-1">
            <Link href="/shop" onClick={() => setMobileOpen(false)} className={cn('block px-3 py-2.5 rounded-lg text-sm font-medium', pathname === '/shop' ? 'text-primary' : 'text-foreground hover:bg-muted')}>Alla produkter</Link>
            {topCategories.map(cat => (
              <Link
                key={cat.id}
                href={`/shop/kategori/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm pl-6',
                  pathname.startsWith(`/shop/kategori/${cat.slug}`) ? 'text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/shop/programs" onClick={() => setMobileOpen(false)} className={cn('block px-3 py-2.5 rounded-lg text-sm font-medium', pathname.startsWith('/shop/programs') ? 'text-primary' : 'text-foreground hover:bg-muted')}>Program</Link>
            <Link href="/shop/nyheter" onClick={() => setMobileOpen(false)} className={cn('block px-3 py-2.5 rounded-lg text-sm font-medium', pathname.startsWith('/shop/nyheter') ? 'text-primary' : 'text-foreground hover:bg-muted')}>Nyheter</Link>
            <Link href="/shop/om-oss" onClick={() => setMobileOpen(false)} className={cn('block px-3 py-2.5 rounded-lg text-sm font-medium', pathname.startsWith('/shop/om-oss') ? 'text-primary' : 'text-foreground hover:bg-muted')}>Om oss</Link>

            {!customer && (
              <Link href="/shop/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                Registrera
              </Link>
            )}
            {customer && (
              <div className="pt-2 border-t border-border">
                <p className="px-3 py-2 text-xs text-muted-foreground">{customer.name ?? customer.email}</p>
              </div>
            )}
          </StorefrontContainer>
        </div>
      )}
    </>
  )
}
