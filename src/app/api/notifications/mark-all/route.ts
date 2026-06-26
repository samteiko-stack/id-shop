import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireWriteAccess } from '@/lib/auth/permissions'

export async function POST() {
  const auth = await requireWriteAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Not authenticated' ? 401 : 403 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
