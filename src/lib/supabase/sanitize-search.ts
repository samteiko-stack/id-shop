/** Strip PostgREST filter metacharacters from user search input. */
export function sanitizePostgrestSearch(raw: string, maxLength = 100): string {
  return raw.trim().slice(0, maxLength).replace(/[,()*\\%]/g, '')
}
