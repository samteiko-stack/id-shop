'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_IDLE_MS = 30 * 60 * 1000

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const

type UseIdleTimeoutOptions = {
  timeoutMs?: number
  redirectTo?: string
  enabled?: boolean
}

function resolveTimeoutMs(timeoutMs?: number) {
  if (timeoutMs != null) return timeoutMs
  const fromEnv = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MS)
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_IDLE_MS
}

export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const timeoutMs = resolveTimeoutMs(options.timeoutMs)
  const redirectTo = options.redirectTo ?? '/login'
  const enabled = options.enabled ?? true

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabaseRef = useRef(createClient())

  const logout = useCallback(async () => {
    await supabaseRef.current.auth.signOut()
    const url = new URL(redirectTo, window.location.origin)
    url.searchParams.set('reason', 'session_expired')
    window.location.href = url.toString()
  }, [redirectTo])

  const resetTimer = useCallback(() => {
    if (!enabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void logout()
    }, timeoutMs)
  }, [enabled, timeoutMs, logout])

  useEffect(() => {
    if (!enabled) return

    resetTimer()

    const onActivity = () => resetTimer()
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true })
    })

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') resetTimer()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, onActivity)
      })
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, resetTimer])
}
