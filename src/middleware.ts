import { type NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { updateSession } from '@/lib/supabase/middleware'
import {
  PUBLIC_ROUTES,
  PUBLIC_EXACT,
  SHOP_AUTH_ROUTES,
  AUTH_REDIRECT,
  DEFAULT_REDIRECT,
  SHOP_AUTH_REDIRECT,
  SHOP_DEFAULT_REDIRECT,
  hasRouteAccess,
  hasApiAccess,
} from '@/constants/routes'
import type { UserRole } from '@/types'

/* ── Rate limiters (only created when env vars exist) ── */
function createRatelimiter(requests: number, windowSeconds: number) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_URL === 'https://your-redis.upstash.io'
  ) {
    return null
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds}s`),
    analytics: false,
  })
}

const rateLimiters = {
  auth:    createRatelimiter(5, 900),   // 5 req / 15 min  — login/reset
  scan:    createRatelimiter(60, 60),   // 60 req / 1 min  — QR scanning
  invoice: createRatelimiter(20, 60),   // 20 req / 1 min  — invoice creation
  orders:  createRatelimiter(30, 60),   // 30 req / 1 min  — order creation
  write:   createRatelimiter(60, 60),   // 60 req / 1 min  — general writes
  read:    createRatelimiter(120, 60),  // 120 req / 1 min — reads
}

async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<boolean> {
  if (!limiter) return true
  try {
    const { success } = await limiter.limit(identifier)
    return success
  } catch {
    // Fail open if Redis is unreachable — don't block requests
    return true
  }
}

function getRateLimiter(pathname: string, method: string) {
  if (pathname.startsWith('/api/traceability/scan')) return rateLimiters.scan
  if (pathname.startsWith('/api/invoices') && method === 'POST') return rateLimiters.invoice
  if (pathname.startsWith('/api/orders') && method === 'POST') return rateLimiters.orders
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/shop/reset-password') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/auth')
  ) return rateLimiters.auth
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return rateLimiters.write
  return rateLimiters.read
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  /* ── Dev bypass — local only, server env (never NEXT_PUBLIC) ── */
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_BYPASS_AUTH === 'true'
  ) {
    return NextResponse.next()
  }

  /* ── Step 1: Session refresh + user retrieval ── */
  const { supabaseResponse, user, role: sessionRole, deactivated } = await updateSession(request)

  if (deactivated) {
    const loginUrl = new URL(AUTH_REDIRECT, request.url)
    loginUrl.searchParams.set('error', 'deactivated')
    const response = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })
    return response
  }

  /* ── Step 2: Shop auth pages — redirect if already logged in as customer ── */
  if (SHOP_AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user && sessionRole === 'customer') {
      return NextResponse.redirect(new URL(SHOP_DEFAULT_REDIRECT, request.url))
    }
    return supabaseResponse
  }

  /* ── Step 2b: Public routes — no auth needed ── */
  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    // Redirect already-logged-in admin/staff away from /login
    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
    }
    return supabaseResponse
  }

  /* ── Step 3: Auth check ── */
  if (!user) {
    // API routes must never redirect — return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Shop cart requires customer login
    if (pathname.startsWith('/shop/cart') || pathname.startsWith('/shop/konto')) {
      return NextResponse.redirect(new URL(`${SHOP_AUTH_REDIRECT}?redirectTo=${pathname}`, request.url))
    }
    const loginUrl = new URL(AUTH_REDIRECT, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  /* ── Step 3b: Customer users stay in the shop — block dashboard access ── */
  const role = (sessionRole ?? user.user_metadata?.role ?? 'read_only') as UserRole
  if (role === 'customer') {
    const allowedOutsideShop =
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/update-password') ||
      pathname.startsWith('/api/storefront/')

    if (!pathname.startsWith('/shop') && !allowedOutsideShop) {
      return NextResponse.redirect(new URL(SHOP_DEFAULT_REDIRECT, request.url))
    }
    return supabaseResponse
  }

  /* ── Step 4: Rate limiting ── */
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1'
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth')
  const identifier = isAuthRoute ? `ip:${ip}` : `user:${user.id}`

  const limiter = getRateLimiter(pathname, method)
  const allowed = await checkRateLimit(limiter, identifier)

  if (!allowed) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    // For page routes, show an error page
    return NextResponse.redirect(new URL('/429', request.url))
  }

  /* ── Step 5: Route authorization ── */
  if (pathname.startsWith('/api/')) {
    if (!hasApiAccess(pathname, role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    if (!hasRouteAccess(pathname, role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  /* ── Step 6: Inject user context into request headers ── */
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        'x-user-id': user.id,
        'x-user-role': role,
        'x-user-email': user.email ?? '',
      }),
    },
  })

  // Copy cookies from supabase response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|ico)$).*)',
  ],
}
