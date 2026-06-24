import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'

/* Admin client — bypasses RLS. Server-side only. */
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function createClient() {
  if (isDevAuthBypassEnabled()) {
    return createAdminClient()
  }
  return createCookieClient()
}

/** Always cookie-based — use this in storefront actions where real user sessions are required. */
export async function createCookieClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can be read but not set
          }
        },
      },
    }
  )
}
