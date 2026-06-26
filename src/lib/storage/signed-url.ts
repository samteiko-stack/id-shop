import { createAdminClient } from '@/lib/supabase/server'

const INVOICE_BUCKET = 'invoices'
const URL_EXPIRY_SECONDS = 3600 // 1 hour

export async function getSignedPDFUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null

  try {
    const admin = await createAdminClient()
    const { data, error } = await admin.storage
      .from(INVOICE_BUCKET)
      .createSignedUrl(storagePath, URL_EXPIRY_SECONDS)

    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}

export async function getSignedPDFUrlBatch(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const results: Record<string, string> = {}
  await Promise.allSettled(
    paths.map(async (path) => {
      const url = await getSignedPDFUrl(path)
      if (url) results[path] = url
    })
  )
  return results
}
