'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertIcon } from '@/components/ui/alert'
import Link from 'next/link'
import { Loader2, ArrowLeft, AlertCircle } from '@/components/icons'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Check your inbox</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A reset link was sent to <strong className="text-foreground">{email}</strong> if the account exists.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Reset password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send you a reset link.
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

        <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
        </Button>
      </form>

      <div className="mt-6">
        <ButtonLink href="/login" variant="ghost" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
        </ButtonLink>
      </div>
    </div>
  )
}
