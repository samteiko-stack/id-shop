'use client'

import { useIdleTimeout } from '@/hooks/use-idle-timeout'

type SessionTimeoutGuardProps = {
  redirectTo?: string
}

export function SessionTimeoutGuard({ redirectTo = '/login' }: SessionTimeoutGuardProps) {
  useIdleTimeout({ redirectTo })
  return null
}
