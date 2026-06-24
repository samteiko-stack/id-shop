import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Shield } from '@/components/icons'
import type { AuditLog } from '@/types'

export const metadata = { title: 'Audit Log' }

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.role !== 'admin') redirect('/dashboard')

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, user:users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  const ACTION_STYLES: Record<string, string> = {
    INSERT: 'bg-[var(--badge-success-bg)] text-[var(--badge-success-fg)]',
    UPDATE: 'bg-[var(--badge-warning-bg)] text-[var(--badge-warning-fg)]',
    DELETE: 'bg-[var(--badge-destructive-bg)] text-[var(--badge-destructive-fg)]',
    VIEW:   'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">Showing last 200 entries. All writes are captured by database triggers.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {!logs || logs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">No audit log entries yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-3">
                  <Badge className={`${ACTION_STYLES[log.action] ?? ''} border-0 text-xs shrink-0 mt-0.5`}>
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-mono font-semibold">{log.table_name}</span>
                      {log.record_id && (
                        <span className="text-muted-foreground text-xs ml-1 font-mono">#{log.record_id.slice(0, 8)}…</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {log.user?.full_name ?? log.user?.email ?? 'system'} · {formatDateTime(log.created_at)}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground font-mono">IP: {log.ip_address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
