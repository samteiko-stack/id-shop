/** Prevent open redirects from ?redirectTo= query params. */
export function safeRedirectPath(path: string | null | undefined, fallback: string): string {
  if (!path) return fallback
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (path.includes('://')) return fallback
  return path
}
