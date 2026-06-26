'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { Loader2, ArrowLeft, AlertCircle } from '@/components/icons'
import { AuthBrandHeadline, AuthBrandPanel } from '@/components/auth/auth-brand-panel'

export default function ShopResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/auth/update-password`,
    })

    if (resetError) {
      setError('Det gick inte att skicka e-postmeddelandet. Försök igen.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-background grid lg:grid-cols-2">
      <AuthBrandPanel>
        <AuthBrandHeadline
          title="Glömt lösenordet?"
          accent="Ingen fara."
          description="Vi skickar en länk till din e-post så att du kan välja ett nytt lösenord."
        />
      </AuthBrandPanel>

      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-10">
            <Link href="/shop" className="inline-block lg:hidden">
              <img src="/logo-blue.png" alt="ID Shop" className="h-7 w-auto" />
            </Link>
            <Link href="/shop/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till inloggning
            </Link>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Kolla din inkorg</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Om <strong className="text-foreground">{email}</strong> är registrerad som kund skickar vi en länk för att återställa lösenordet.
                </p>
              </div>
              <Link href="/shop/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Till inloggning
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Återställ lösenord</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Ange e-postadressen för ditt företagskonto.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertIcon variant="destructive"><AlertCircle /></AlertIcon>
                    {error}
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                    E-postadress
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="du@klinik.se"
                    required
                    autoFocus
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Skicka återställningslänk'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
