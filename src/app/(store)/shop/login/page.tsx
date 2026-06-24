'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from '@/components/icons'
import { AuthBrandHeadline, AuthBrandPanel } from '@/components/auth/auth-brand-panel'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'), '/shop')
  const sessionExpired = searchParams.get('reason') === 'session_expired'
  const passwordReset = searchParams.get('passwordReset') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    sessionExpired ? 'Du loggades ut på grund av inaktivitet. Logga in igen.' : null
  )
  const [success, setSuccess] = useState<string | null>(
    passwordReset ? 'Lösenordet är uppdaterat. Logga in med ditt nya lösenord.' : null
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Felaktig e-postadress eller lösenord.')
      setLoading(false)
      return
    }

    if (data.user?.user_metadata?.role !== 'customer') {
      await supabase.auth.signOut()
      setError('Den här inloggningen är endast för kunder. Personal använder huvudinloggningen.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      setError('Ditt konto har inaktiverats. Kontakta oss om du behöver hjälp.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background grid lg:grid-cols-2">
      <AuthBrandPanel>
        <AuthBrandHeadline
          title="Beställ smartare."
          accent="Levererat snabbare."
          description="Bläddra i vårt sortiment, lägg beställningar online och håll koll på din historik – allt på ett ställe."
        />
      </AuthBrandPanel>

      {/* Right — form */}
      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Back link — always visible */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/shop" className="inline-block lg:hidden">
              <img src="/logo-blue.png" alt="ID Shop" className="h-7 w-auto" />
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Tillbaka till butiken
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Välkommen tillbaka</h1>
            <p className="text-sm text-muted-foreground mt-1">Logga in på ditt konto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <Alert>
                <AlertIcon><CheckCircle2 /></AlertIcon>
                {success}
              </Alert>
            )}
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
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="du@klinik.se"
                required autoFocus disabled={loading} className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                  Lösenord
                </Label>
                <Link href="/shop/reset-password" className="text-xs text-primary font-medium hover:underline">
                  Glömt lösenord?
                </Link>
              </div>
              <PasswordInput
                id="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required disabled={loading} className="h-11"
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Logga in'}
            </Button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Inget konto?{' '}
            <Link href="/shop/register" className="text-primary font-medium hover:underline">
              Registrera dig
            </Link>
          </p>

          <p className="mt-4 text-xs text-center text-muted-foreground/50">
            Personal hos ID Shop?{' '}
            <Link href="/login" className="hover:text-muted-foreground transition-colors underline underline-offset-2">
              Logga in på personalportalen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ShopLoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
