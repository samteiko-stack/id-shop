'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import Link from 'next/link'
import { Loader2, AlertCircle } from '@/components/icons'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'), '/dashboard')
  const deactivated = searchParams.get('error') === 'deactivated'
  const sessionExpired = searchParams.get('reason') === 'session_expired'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    deactivated
      ? 'Your account has been deactivated. Contact your administrator.'
      : sessionExpired
        ? 'You were signed out after a period of inactivity. Please sign in again.'
        : null
  )

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      )
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
      setError('Your account has been deactivated. Contact your administrator.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertIcon variant="destructive"><AlertCircle /></AlertIcon>
          {error}
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          disabled={loading}
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">
            Password
          </Label>
          <Link
            href="/reset-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
          className="h-11"
        />
      </div>

      <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-5 animate-pulse">
            <div className="h-11 bg-muted rounded-md" />
            <div className="h-11 bg-muted rounded-md" />
            <div className="h-11 bg-muted rounded-md" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-xs text-muted-foreground">
        Access is by invitation only. Contact your administrator.
      </p>

      <div className="mt-6 pt-6 border-t border-border">
        <a href="/shop/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
          Kund? Gå till butiken
        </a>
      </div>
    </div>
  )
}
