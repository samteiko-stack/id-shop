'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/auth/password-rules'
import { activateInvitedUser } from '@/app/(platform)/users/actions'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import { Loader2, AlertCircle } from '@/components/icons'
import { AuthBrandHeadline, AuthBrandPanel } from '@/components/auth/auth-brand-panel'

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInviteFlow = searchParams.get('flow') === 'invite'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setError('Länken är ogiltig eller har gått ut. Begär en ny återställningslänk.')
      setCheckingSession(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Länken är ogiltig eller har gått ut.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Det gick inte att uppdatera lösenordet. Försök igen.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role ?? user.user_metadata?.role

    if (isInviteFlow && role !== 'customer') {
      const activation = await activateInvitedUser()
      if (activation.error) {
        setError(activation.error)
        setLoading(false)
        return
      }
      router.push('/dashboard')
      return
    }

    await supabase.auth.signOut()

    if (role === 'customer') {
      router.push('/shop/login?passwordReset=1')
      return
    }

    router.push('/login?passwordReset=1')
  }

  if (checkingSession) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background grid lg:grid-cols-2">
      <AuthBrandPanel>
        <AuthBrandHeadline
          title="Välj ett nytt"
          accent="lösenord."
          description="Använd minst 8 tecken med versaler, gemener och siffror."
        />
      </AuthBrandPanel>

      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-10">
            <Link href="/shop" className="inline-block lg:hidden">
              <img src="/logo-blue.png" alt="Infinity Dental" className="h-7 w-auto" />
            </Link>
            <Link href="/shop/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
              Till inloggning
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Nytt lösenord</h1>
            <p className="text-sm text-muted-foreground mt-1">Ange ditt nya lösenord nedan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertIcon variant="destructive"><AlertCircle /></AlertIcon>
                {error}
                {error.includes('gått ut') && (
                  <span className="block mt-2">
                    <Link href="/shop/reset-password" className="underline font-medium">
                      Begär ny länk
                    </Link>
                  </span>
                )}
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
                Nytt lösenord
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-xs font-semibold uppercase tracking-wider">
                Bekräfta lösenord
              </Label>
              <PasswordInput
                id="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Spara nytt lösenord'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  )
}
