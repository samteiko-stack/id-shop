'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from '@/components/icons'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. If this keeps happening, please contact support.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground/60 mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/'}>Go home</Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  )
}
