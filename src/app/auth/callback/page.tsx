'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'
import { Loader2 } from '@/components/icons'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const next = safeRedirectPath(searchParams.get('next'), '/dashboard')
    let cancelled = false

    async function finish() {
      if (!cancelled) router.replace(next)
    }

    async function handleCallback() {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'recovery' | 'email' | 'invite',
        })
        if (otpError) {
          if (!cancelled) setError('Länken är ogiltig eller har gått ut.')
          return
        }
        await finish()
        return
      }

      const code = searchParams.get('code')
      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!codeError) {
          await finish()
          return
        }
      }

      // Implicit flow: tokens arrive in the URL hash (#access_token=...)
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        const { data: { session }, error: hashError } = await supabase.auth.getSession()
        if (hashError) {
          if (!cancelled) setError('Länken är ogiltig eller har gått ut.')
          return
        }
        if (session) {
          await finish()
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await finish()
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          finish()
        }
      })

      const timeout = window.setTimeout(() => {
        if (!cancelled) setError('Länken är ogiltig eller har gått ut.')
      }, 10000)

      return () => {
        subscription.unsubscribe()
        window.clearTimeout(timeout)
      }
    }

    const cleanupPromise = handleCallback()

    return () => {
      cancelled = true
      void cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-sm text-primary font-medium hover:underline">
            Gå till inloggning
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  )
}
