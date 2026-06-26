import type { AuditAction } from '@/types'
import { createClient } from '@/lib/supabase/server'

interface AuditLogEntry {
  tableName: string
  recordId: string
  action: AuditAction
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  ipAddress?: string | null
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('audit_log').insert({
      table_name: entry.tableName,
      record_id: entry.recordId,
      action: entry.action,
      changed_by: user.id,
      old_data: entry.oldData ?? null,
      new_data: entry.newData ?? null,
      ip_address: entry.ipAddress ?? null,
    })

    if (error) {
      console.error('[AuditLog] Failed to write audit entry:', error.message)
    }
  } catch (err) {
    console.error('[AuditLog] Unexpected error:', err)
  }
}

export async function writeAuditLogWithAdmin(
  entry: AuditLogEntry,
  userId: string
): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    const { error } = await supabase.from('audit_log').insert({
      table_name: entry.tableName,
      record_id: entry.recordId,
      action: entry.action,
      changed_by: userId,
      old_data: entry.oldData ?? null,
      new_data: entry.newData ?? null,
      ip_address: entry.ipAddress ?? null,
    })

    if (error) {
      console.error('[AuditLog] Failed to write audit entry:', error.message)
    }
  } catch (err) {
    console.error('[AuditLog] Unexpected error:', err)
  }
}
