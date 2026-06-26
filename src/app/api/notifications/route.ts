import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

const PLATFORM_ROLES: UserRole[] = ['admin', 'staff', 'read_only']

export async function GET() {
  const auth = await getCurrentUserRole()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!PLATFORM_ROLES.includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
