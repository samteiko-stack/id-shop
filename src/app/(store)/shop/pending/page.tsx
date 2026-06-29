import { ButtonLink } from '@/components/ui/button'
import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-8">
      <div className="w-full max-w-sm text-center">
        <Link href="/shop" className="inline-block mb-10">
          <img src="/logo-blue.png" alt="Infinity Dental" className="h-7 w-auto" />
        </Link>

        <div className="h-14 w-14 bg-muted flex items-center justify-center mx-auto mb-6">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">Väntar på godkännande</h1>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          Din registrering har tagits emot. Vårt team kommer att granska och aktivera ditt konto inom kort.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Du kommer att kunna se priser och lägga beställningar när du har godkänts.
        </p>

        <div className="space-y-3">
          <ButtonLink href="/shop" className="w-full font-semibold">
            Bläddra i sortimentet
          </ButtonLink>
          <ButtonLink href="/shop/login" variant="outline" className="w-full">
            Tillbaka till inloggning
          </ButtonLink>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Frågor?{' '}
          <a href="mailto:info@idshop.se" className="text-primary hover:underline">info@idshop.se</a>
        </p>
      </div>
    </div>
  )
}
