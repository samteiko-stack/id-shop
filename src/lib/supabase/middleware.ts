import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() to refresh token
  let {
    data: { user },
  } = await supabase.auth.getUser()

  let role: UserRole | undefined
  let deactivated = false

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      user = null
      deactivated = true
    } else {
      role = (profile?.role ?? user.user_metadata?.role ?? 'read_only') as UserRole
    }
  }

  return { supabaseResponse, user, role, deactivated }
}
