'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Package, ChevronRight } from '@/components/icons'
import { Card, CardContent } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'

export function DashboardAlerts() {
  const router = useRouter()
  const pathname = usePathname()
  const [newOrders, setNewOrders] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data: Notification[] = await res.json()
      setNewOrders(data.filter((n) => n.type === 'new_order' && !n.is_read))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts, pathname])

  useEffect(() => {
    function onFocus() {
      fetchAlerts()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [fetchAlerts])

  async function handleAlertClick(n: Notification) {
    setNewOrders((prev) => prev.filter((item) => item.id !== n.id))
    await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
    router.push(n.link ?? '/orders')
  }

  if (loading || newOrders.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-foreground truncate">
              {newOrders.length === 1
                ? '1 new storefront order'
                : `${newOrders.length} new storefront orders`}
            </p>
          </div>
          <ButtonLink href="/orders" variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0">
            View all sales
          </ButtonLink>
        </div>

        <ul className="rounded-md border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
          {newOrders.slice(0, 3).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleAlertClick(n)}
                className="group flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">{n.title}</p>
                  {n.body ? (
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{n.body}</p>
                  ) : null}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 tabular-nums">
                  {formatDateTime(n.created_at)}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
