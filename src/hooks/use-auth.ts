'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/types'
import type { UserRole } from '@/types'

const DEV_USER: AuthUser = {
  id: 'dev-mock-user',
  email: 'admin@idshop.dev',
  role: 'admin' as UserRole,
  full_name: 'Dev Admin',
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' ? DEV_USER : null
  )
  const [loading, setLoading] = useState(
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== 'true'
  )
  const supabase = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' ? null : createClient()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') return
    if (!supabase) return

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase!
            .from('users')
            .select('role, full_name')
            .eq('id', session.user.id)
            .maybeSingle()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: (profile?.role ?? session.user.user_metadata?.role ?? 'read_only') as UserRole,
            full_name: profile?.full_name ?? session.user.user_metadata?.full_name,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase?.auth.signOut()
    window.location.href = '/login'
  }

  return { user, loading, signOut }
}
