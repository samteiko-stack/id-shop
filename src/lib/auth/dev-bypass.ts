/** Server-only dev bypass — never enable in production. */
export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_BYPASS_AUTH === 'true'
  )
}
