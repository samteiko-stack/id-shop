'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { applyGeneralDiscount } from '@/lib/discounts'
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  BadgeCheck,
  Layers,
  ShoppingBag,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'
import { CategoryCard } from '@/components/shop/category-card'
import { StorefrontContainer } from '@/components/layout/storefront-container'
import { BrandSurface } from '@/components/storefront/brand-surface'

type FeaturedProduct = {
  id: string
  name: string
  ref: string
  unit_price: number | null
  currency: string | null
  image_url: string | null
  categories: { id: string; name: string } | null
}

type TopCategory = {
  id: string
  name: string
  slug: string
  image_url: string | null
}

interface HomepageClientProps {
  featuredProducts: FeaturedProduct[]
  topCategories: TopCategory[]
  isLoggedIn: boolean
  discountRate?: number
}

const FEATURES = [
  { icon: BadgeCheck,     title: 'CE-certifierade produkter', desc: 'Alla produkter uppfyller EU:s krav för medicintekniska produkter och bär CE-märkning.' },
  { icon: Layers,         title: 'Brett sortiment',           desc: 'Dentalinstrument, förbrukningsartiklar, sterilisering, avbildning och mycket mer.' },
  { icon: Truck,          title: 'Snabb leverans',            desc: 'Nästa dags leverans i hela Sverige för lagerförda artiklar.' },
  { icon: HeadphonesIcon, title: 'Expertsupport',             desc: 'Vårt team kan produkterna och hjälper dig hitta rätt – varje gång.' },
  { icon: ShieldCheck,    title: 'Betrodda leverantörer',     desc: 'Vi sourcear enbart från certifierade tillverkare och auktoriserade distributörer.' },
  { icon: ShoppingBag,    title: 'Enkel onlinebeställning',   desc: 'Bläddra, beställ och hantera dina inköp helt online – inga telefonsamtal krävs.' },
] as const

export function HomepageClient({ featuredProducts, topCategories, isLoggedIn, discountRate = 0 }: HomepageClientProps) {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(560px, 75vw, 800px)' }}>
        <video
          autoPlay muted loop playsInline aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <StorefrontContainer className="relative h-full flex flex-col justify-end py-16 lg:py-20">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-4">
              Ledande inom<br />Medicinsk &amp; Dental Supply
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-sm mb-8">
              Innovativa lösningar för moderna kliniker och sjukvården i hela Sverige.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop">
                <Button className="font-semibold">
                  Utforska produkterna <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link href="/shop/register">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/15 hover:text-white bg-transparent rounded-lg">
                    Bli kund
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </StorefrontContainer>
      </section>
      {topCategories.length > 0 && (
        <section className="bg-background border-b border-border py-16 lg:py-20">
          <StorefrontContainer>
            <div className="flex items-end justify-between gap-4 mb-10">
              <SectionHeading
                title="Sortiment"
                subtitle="Bläddra efter kategori och hitta rätt produkter för din klinik"
              />
              <Link href="/shop/kategori" className="hidden sm:flex items-center gap-1 text-primary text-sm font-semibold hover:opacity-80 transition-opacity shrink-0">
                Alla kategorier <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {topCategories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  href={`/shop/kategori/${cat.slug}`}
                  imageUrl={cat.image_url}
                />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop/kategori">
                <Button variant="outline" className="gap-2 font-medium">
                  Alla kategorier <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </StorefrontContainer>
        </section>
      )}

      {/* ─── TRUST STATEMENT ─────────────────────────── */}
      <BrandSurface as="section" className="py-20 lg:py-28">
        <StorefrontContainer>
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-start">
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 space-y-8">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.08] text-white">
                  Kvalitet, innovation och utbildning
                </h2>
                <p className="mt-5 text-base leading-relaxed text-white/65 max-w-md">
                  Vi levererar mer än produkter – vi bygger framtidens sjukvård. ID Shop är en dedikerad
                  leverantör av medicinska och dentala produkter till kliniker, sjukhus och vårdgivare i hela Sverige.
                </p>
              </div>

              <div className="hidden lg:block h-px w-16 bg-white/20" aria-hidden />

              <p className="border-l-2 border-primary/80 pl-5 text-sm leading-relaxed text-white/55 max-w-sm">
                Tillsammans skapar vi bättre resultat för både kliniker och patienter.
              </p>
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              <div className="grid sm:grid-cols-2 gap-3 lg:gap-4">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md lg:p-7 transition-colors hover:border-white/20 hover:bg-white/[0.1]"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </StorefrontContainer>
      </BrandSurface>

      {/* ─── FEATURED PRODUCTS ───────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="bg-muted/40 border-y border-border py-28">
          <StorefrontContainer>
            <div className="flex items-end justify-between mb-10">
              <SectionHeading
                title="Nya produkter"
                subtitle="De senaste tilläggen till vårt sortiment"
              />
              <Link href="/shop" className="hidden sm:flex items-center gap-1 text-primary text-sm font-semibold hover:opacity-80 transition-opacity">
                Visa alla <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/shop/products/${product.id}`}
                  className="group border border-border bg-card rounded-lg hover:border-primary/40 transition-colors overflow-hidden"
                >
                  <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                    {product.image_url ? (
                      <NextImage src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground/20 select-none">{product.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {product.categories && (
                      <span className="text-xs text-primary font-medium uppercase tracking-wide">{product.categories.name}</span>
                    )}
                    <h3 className="font-semibold text-sm text-foreground mt-1 leading-snug line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{product.ref}</p>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      {isLoggedIn && product.unit_price != null
                        ? <span className="text-base font-bold text-foreground">{applyGeneralDiscount(product.unit_price, discountRate).toFixed(2)} <span className="text-sm font-normal">{product.currency ?? 'SEK'}</span></span>
                        : <span className="italic">Logga in som företag</span>
                      }
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop">
                <Button variant="outline" className="gap-2 font-medium">Visa alla produkter <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </StorefrontContainer>
        </section>
      )}

      {/* ─── BOTTOM CTA ──────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-20 lg:py-28">
        <StorefrontContainer className="text-center">
          <SectionHeading
            title="Redo att förenkla din försörjningskedja?"
            subtitle="Anslut dig till sjukvårdspersonal i hela Sverige som litar på ID Shop för certifierade produkter, snabb leverans och pålitlig service."
            align="center"
            className="mb-10"
          />
          <div className="flex flex-wrap gap-4 justify-center">
            {!isLoggedIn ? (
              <>
                <Link href="/shop/register">
                  <Button className="font-semibold">
                    Registrera klinik <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline" className="font-semibold">
                    Utforska sortimentet
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/shop">
                <Button className="font-semibold">
                  Utforska sortimentet <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </StorefrontContainer>
      </section>

    </div>
  )
}
