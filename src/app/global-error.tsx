'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Critical error</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            The application encountered a fatal error and could not recover.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#999', marginBottom: 24 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
