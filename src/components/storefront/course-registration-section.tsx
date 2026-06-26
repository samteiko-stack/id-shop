import { StorefrontContainer } from '@/components/layout/storefront-container'
import { HubSpotFormEmbed } from '@/components/storefront/hubspot-form-embed'

interface Props {
  html: string
  title?: string
  description?: string
}

export function CourseRegistrationSection({
  html,
  title = 'Anmäl dig till kursen',
  description = 'Fyll i formuläret nedan så återkommer vi med bekräftelse och mer information.',
}: Props) {
  return (
    <section id="anmalan" className="border-t border-border bg-muted/40 py-16 md:py-20">
      <StorefrontContainer>
        <div className="mx-auto w-full max-w-xl">
          <header className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{description}</p>
          </header>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <HubSpotFormEmbed html={html} className="course-registration-form" />
          </div>
        </div>
      </StorefrontContainer>
    </section>
  )
}
