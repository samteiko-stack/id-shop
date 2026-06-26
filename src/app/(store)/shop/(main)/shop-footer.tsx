'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Phone, Mail, ArrowRight, ArrowUp } from '@/components/icons'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { BrandSurface } from '@/components/storefront/brand-surface'
import type { FooterCategoryGroup } from '@/lib/storefront/footer-categories'

const COMPANY = {
  name: 'Infinity Dental Shop AB',
  orgNumber: '559164-8620',
  address: 'Tullhusgatan 14, 602 28 Norrköping',
  phone: '076-086 72 80',
  phoneHref: 'tel:+46760867280',
  email: 'info@idsshop.se',
}

const ABOUT_EXCERPT =
  'IDS bygger på samspelet mellan tandläkares erfarenhet, opinionsbildare inom dental implantologi och ett ingenjörsteam som utvecklar lösningar för implantologi.'

function FooterColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-white pb-3 mb-5 border-b border-white/20">
      {children}
    </h3>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

type ShopFooterProps = {
  categoryGroups?: FooterCategoryGroup[]
}

export function ShopFooter({ categoryGroups = [] }: ShopFooterProps) {
  const year = new Date().getFullYear()

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <BrandSurface as="footer" className="mt-auto" waves={false} variant="footer">
      <StorefrontContainer className="py-14 lg:py-16">
        <Link href="/" className="inline-block mb-10 lg:mb-12">
          <img src="/logo-white.png" alt="ID Shop" className="h-12 w-auto" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          <div>
            <FooterColumnHeading>Om oss</FooterColumnHeading>
            <p className="text-sm text-white/65 leading-relaxed">
              {ABOUT_EXCERPT}{' '}
              <Link href="/shop/om-oss" className="text-primary hover:text-primary/80 transition-colors">
                Läs mer
              </Link>
            </p>
            <div className="mt-6 space-y-2.5">
              <a
                href={COMPANY.phoneHref}
                className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {COMPANY.phone}
              </a>
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {COMPANY.email}
              </a>
            </div>
          </div>

          <div>
            <FooterColumnHeading>{COMPANY.name}</FooterColumnHeading>
            <div className="space-y-2 text-sm text-white/65 leading-relaxed">
              <p>Organisationsnummer: {COMPANY.orgNumber}</p>
              <p>{COMPANY.address}</p>
            </div>
          </div>

          <div>
            <FooterColumnHeading>Följ oss</FooterColumnHeading>
            <p className="text-sm text-white/65 leading-relaxed mb-5">
              Klicka på länkarna nedan för att följa oss i sociala medier.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {categoryGroups.length > 0 && (
          <div className="mt-14 pt-14 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">
                  Sortiment
                </p>
                <p className="text-sm text-white/55 max-w-lg">
                  Bläddra i våra huvudkategorier och underkategorier.
                </p>
              </div>
              <Link
                href="/shop/kategori"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
              >
                Alla kategorier <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
              {categoryGroups.map((group) => (
                <div key={group.id}>
                  <Link
                    href={`/shop/kategori/${group.slug}`}
                    className="text-sm font-semibold text-white hover:text-primary transition-colors mb-3 block leading-snug"
                  >
                    {group.name}
                  </Link>
                  {group.subcategories.length > 0 ? (
                    <ul className="space-y-2">
                      {group.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/shop/kategori/${group.slug}/${sub.slug}`}
                            className="text-sm text-white/55 hover:text-white transition-colors leading-snug"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Link
                      href={`/shop/kategori/${group.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-white/45 hover:text-white transition-colors"
                    >
                      Visa produkter <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </StorefrontContainer>

      <div className="border-t border-white/10 bg-black/35">
        <StorefrontContainer className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50 text-center sm:text-left">
            © {year} Infinity Dental Shop. Alla rättigheter reserverade.
            <span className="hidden sm:inline text-white/30 mx-2">·</span>
            <Link
              href="/login"
              className="block sm:inline mt-2 sm:mt-0 text-white/40 hover:text-white/70 transition-colors"
            >
              Inloggning för personal
            </Link>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href={`mailto:${COMPANY.email}`}
              className="text-xs text-white/55 hover:text-white transition-colors"
            >
              Kontakta oss
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Tillbaka till toppen"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-white/55 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </StorefrontContainer>
      </div>
    </BrandSurface>
  )
}
