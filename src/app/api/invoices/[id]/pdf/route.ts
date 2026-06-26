import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serveInvoicePdf } from '@/lib/pdf/serve-invoice-pdf'
import { requireWriteAccess } from '@/lib/auth/permissions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriteAccess()
  if ('error' in auth) {
    return Response.json({ error: auth.error }, { status: auth.error === 'Not authenticated' ? 401 : 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  return serveInvoicePdf(supabase, id)
}
