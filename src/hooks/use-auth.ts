'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/types'
import type { UserRole } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
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
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, loading, signOut }
}
