'use client'

import { StorefrontContainer } from '@/components/layout/storefront-container'
import { StorefrontPageHero } from '@/components/storefront/storefront-page-hero'
import { STOREFRONT_MAX_WIDTH_LARGE } from '@/constants/storefront-layout'
import { cn } from '@/lib/utils'

const STATS = [
  {
    caption: 'Kliniker och vårdgivare som litar på oss i hela Sverige.',
    value: '500+',
  },
  {
    caption: 'År av erfarenhet inom medicinsk och dental försörjning.',
    value: '12+',
  },
  {
    caption: 'Beställningar levererade med spårbarhet och kvalitet.',
    value: '20k+',
  },
]

export function AboutClient() {
  return (
    <div>
      <StorefrontPageHero
        eyebrow="ID Shop"
        title="Om oss"
        description="Vi levererar certifierade medicinska och dentala produkter till kliniker i hela Sverige — med fokus på kvalitet, spårbarhet och enkel onlinebeställning."
      />

      {/* Page content */}
      <StorefrontContainer pageSpacing>
        <div className="space-y-12 md:space-y-16 lg:space-y-20">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl md:rounded-2xl bg-muted border border-border">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden />
          </div>

          <div className="w-full space-y-12 md:space-y-16 lg:space-y-20">
          {/* Story row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-start">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              Tillsammans bygger vi bättre försörjning
            </h2>
            <div className={cn('space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed', STOREFRONT_MAX_WIDTH_LARGE)}>
              <p className="font-medium text-foreground">
                ID Shop grundades för att göra det enklare för kliniker att beställa det de behöver —
                utan krångel och med full transparens.
              </p>
              <p>
                Vi samlar dentalinstrument, förbrukningsartiklar, sterilisering och tillbehör på ett ställe.
                Tydliga priser, snabb leverans och produkter som uppfyller regulatoriska krav.
              </p>
              <p>
                Utöver sortimentet erbjuder vi utbildningsprogram inom implantologi, kirurgi och protetik
                för praktiker som vill utvecklas.
              </p>
            </div>
          </div>

          {/* Quote row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-start pt-12 md:pt-16 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                <span className="text-lg font-bold text-primary">ID</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">ID Shop Team</p>
                <p className="text-sm text-muted-foreground">Grundare &amp; ledning</p>
              </div>
            </div>
            <blockquote className={cn('text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-snug', STOREFRONT_MAX_WIDTH_LARGE)}>
              &ldquo;Vårt mål är att göra klinikförsörjning lika enkel som den ska vara — så att er tid
              går till patienterna, inte till administration.&rdquo;
            </blockquote>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-12 pt-12 md:pt-16 border-t border-border">
            {STATS.map(({ caption, value }) => (
              <div key={value} className="space-y-4 md:space-y-6">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{caption}</p>
                <p className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </StorefrontContainer>
    </div>
  )
}
