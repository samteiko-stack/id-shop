#!/usr/bin/env node
/**
 * Audits platform users for role drift between public.users and auth metadata.
 * Run: node scripts/audit-user-roles.mjs
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: profiles, error: profileError } = await admin
  .from('users')
  .select('id, email, full_name, role')
  .order('email')

if (profileError) {
  console.error(profileError)
  process.exit(1)
}

const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 200 })
if (authError) {
  console.error(authError)
  process.exit(1)
}

const authById = new Map(authData.users.map((u) => [u.id, u]))

let mismatches = 0
console.log('\nPlatform user roles:\n')
for (const profile of profiles ?? []) {
  const authUser = authById.get(profile.id)
  const authRole = authUser?.user_metadata?.role ?? '(no auth user)'
  const ok = authRole === profile.role
  if (!ok) mismatches++
  console.log(
    `${ok ? '✓' : '✗'} ${profile.email}`,
    `\n   DB: ${profile.role}  |  Auth: ${authRole}${!ok ? '  ← MISMATCH' : ''}\n`,
  )
}

if (mismatches > 0) {
  console.error(`${mismatches} role mismatch(es). Fix via Users → change role, or re-run after syncing.`)
  process.exit(1)
}

console.log('All roles in sync.')
