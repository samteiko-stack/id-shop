'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { Loader2, AlertCircle } from '@/components/icons'
import { registerCustomer } from '../actions'
import { AuthBrandHeadline, AuthBrandPanel } from '@/components/auth/auth-brand-panel'

function Field({
  id, name, label, required, type = 'text', placeholder, disabled, error, className,
}: {
  id: string; name: string; label: string; required?: boolean
  type?: string; placeholder?: string; disabled?: boolean; error?: string; className?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {type === 'password' ? (
        <PasswordInput
          id={id} name={name} placeholder={placeholder}
          required={required} disabled={disabled}
          className={`h-11 ${error ? 'border-destructive' : ''} ${className ?? ''}`}
        />
      ) : (
        <Input
          id={id} name={name} type={type} placeholder={placeholder}
          required={required} disabled={disabled}
          className={`h-11 ${error ? 'border-destructive' : ''} ${className ?? ''}`}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function ShopRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string

    if (password !== confirm) {
      setFieldErrors({ confirm_password: 'Lösenorden matchar inte' })
      setLoading(false)
      return
    }

    const result = await registerCustomer(formData)
    if (result.error) { setError(result.error); setLoading(false) }
    else router.push('/shop/pending')
  }

  return (
    <div className="min-h-dvh bg-background grid lg:grid-cols-2">
      <AuthBrandPanel>
        <AuthBrandHeadline
          title="Anslut till tusentals"
          accent="yrkespersoner."
          description="Skapa ett företagskonto för att få tillgång till priser, lägga beställningar online och hantera din inköpshistorik."
        />
      </AuthBrandPanel>

      {/* Right — form */}
      <div className="flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Back link — always visible */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/shop" className="inline-block lg:hidden">
              <img src="/logo-blue.png" alt="Infinity Dental" className="h-7 w-auto" />
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Tillbaka till butiken
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Skapa företagskonto</h1>
            <p className="text-sm text-muted-foreground mt-1">Ditt konto granskas och aktiveras av oss.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertIcon variant="destructive"><AlertCircle /></AlertIcon>
                {error}
              </Alert>
            )}

            {/* Section: Företagsinformation */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
                Företagsinformation
              </p>
              <Field id="company" name="company" label="Företagsnamn" required placeholder="Tandklinik Stockholm AB" disabled={loading} />
              <div className="grid grid-cols-2 gap-4">
                <Field id="org_number" name="org_number" label="Organisationsnummer" required placeholder="556789-1234" disabled={loading} />
                <Field id="tax_id" name="tax_id" label="Moms­nr (valfritt)" placeholder="SE556789123401" disabled={loading} />
              </div>
              <Field id="address" name="address" label="Fakturaadress" placeholder="Storgatan 1, 111 23 Stockholm" disabled={loading} />
              <Field id="website" name="website" label="Webbplats (valfritt)" placeholder="www.klinik.se" disabled={loading} />
            </div>

            {/* Section: Kontaktperson */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
                Kontaktperson
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field id="first_name" name="first_name" label="Förnamn" required placeholder="Anna" disabled={loading} />
                <Field id="last_name" name="last_name" label="Efternamn" required placeholder="Lindqvist" disabled={loading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field id="email" name="email" label="E-post" required type="email" placeholder="du@klinik.se" disabled={loading} />
                <Field id="phone" name="phone" label="Telefon" required placeholder="+46 700 000 000" disabled={loading} />
              </div>
            </div>

            {/* Section: Inloggningsuppgifter */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
                Inloggningsuppgifter
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field id="password" name="password" label="Lösenord" required type="password" placeholder="••••••••" disabled={loading} />
                <Field
                  id="confirm_password" name="confirm_password" label="Bekräfta lösenord"
                  required type="password" placeholder="••••••••"
                  disabled={loading} error={fieldErrors.confirm_password}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minst 8 tecken, 1 versal, 1 gemen och 1 siffra.
              </p>
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrera företag'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Har du redan ett konto?{' '}
            <Link href="/shop/login" className="text-primary font-medium hover:underline">Logga in som företag</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
