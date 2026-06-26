import { createAdminClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types'

export async function createNotification({
  type,
  title,
  body,
  link,
}: {
  type: NotificationType
  title: string
  body?: string
  link?: string
}) {
  try {
    const admin = await createAdminClient()
    const { error } = await admin.from('notifications').insert({
      type,
      title,
      body: body ?? null,
      link: link ?? null,
    })
    if (error) {
      console.error('[notifications] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[notifications] unexpected error:', err)
  }
}

export async function getUnreadNotifications(limit = 30) {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[notifications] fetch failed:', error.message)
    return []
  }
  return data ?? []
}

const ORDER_LINK_RE = /\/orders\/([0-9a-f-]{36})/i

export function orderIdFromNotificationLink(link: string | null | undefined): string | null {
  if (!link) return null
  return link.match(ORDER_LINK_RE)?.[1] ?? null
}

/** Order IDs with unread new_order notifications (not yet opened by staff). */
export async function getUnreadOrderIds(): Promise<Set<string>> {
  const unread = await getUnreadNotifications(100)
  const ids = new Set<string>()
  for (const n of unread) {
    if (n.type !== 'new_order') continue
    const orderId = orderIdFromNotificationLink(n.link)
    if (orderId) ids.add(orderId)
  }
  return ids
}

export async function markOrderNotificationsRead(orderId: string) {
  try {
    const admin = await createAdminClient()
    const { error } = await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('type', 'new_order')
      .eq('is_read', false)
      .like('link', `%/orders/${orderId}%`)

    if (error) {
      console.error('[notifications] mark order read failed:', error.message)
    }
  } catch (err) {
    console.error('[notifications] mark order read unexpected error:', err)
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const admin = await createAdminClient()
    const { error } = await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('[notifications] mark read failed:', error.message)
    }
  } catch (err) {
    console.error('[notifications] mark read unexpected error:', err)
  }
}
