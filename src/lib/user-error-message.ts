export type UserErrorContext = 'platform' | 'storefront'

interface PgErrorLike {
  message?: string
  code?: string
}

const DEFAULT_FALLBACK = {
  platform: 'Something went wrong. Please try again.',
  storefront: 'Något gick fel. Försök igen.',
} as const

export function mergeOrderLineItems<T extends { product_id: string; quantity: number; unit_price: number }>(
  items: T[],
): T[] {
  const map = new Map<string, T>()

  for (const item of items) {
    const existing = map.get(item.product_id)
    if (existing) {
      existing.quantity += item.quantity
      existing.unit_price = item.unit_price
    } else {
      map.set(item.product_id, { ...item })
    }
  }

  return [...map.values()]
}

export function toUserError(
  error: unknown,
  fallback?: string,
  context: UserErrorContext = 'platform',
): string {
  const defaultFallback = fallback ?? DEFAULT_FALLBACK[context]

  if (!error) return defaultFallback
  if (typeof error === 'string') {
    return friendlyFromText(error, context) ?? (isTechnicalMessage(error) ? defaultFallback : error)
  }

  const pg = error as PgErrorLike
  const message = pg.message ?? ''
  const code = pg.code ?? ''

  if (code === '23505' || /duplicate key value/i.test(message)) {
    if (/idx_order_items_order_product|order_items.*product/i.test(message)) {
      return context === 'storefront'
        ? 'Produkten finns redan i beställningen.'
        : 'This order already has that product. Use one line per product and set the total quantity there.'
    }
    if (/customers|email|org_number|auth_user/i.test(message)) {
      return context === 'storefront'
        ? 'En kund med dessa uppgifter finns redan.'
        : 'A customer with these details already exists.'
    }
    if (/invoice_number|order_number|credit_number/i.test(message)) {
      return 'That document number already exists. Refresh and try again.'
    }
    return context === 'storefront' ? 'Detta finns redan.' : 'That record already exists.'
  }

  if (code === '23503' || /foreign key constraint/i.test(message)) {
    return context === 'storefront'
      ? 'Något som hör till posten saknas eller har tagits bort. Ladda om sidan och försök igen.'
      : 'Something linked to this record was removed or is invalid. Refresh the page and try again.'
  }

  if (code === '23502' || /not-null constraint/i.test(message)) {
    return context === 'storefront' ? 'Obligatorisk information saknas.' : 'Required information is missing.'
  }

  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    return context === 'storefront'
      ? 'Du har inte behörighet att göra detta.'
      : "You don't have permission to do this."
  }

  if (/JWT expired|Invalid Refresh Token|refresh_token/i.test(message)) {
    return context === 'storefront' ? 'Du måste logga in igen.' : 'Your session expired. Please sign in again.'
  }

  const friendly = friendlyFromText(message, context)
  if (friendly) return friendly

  if (isTechnicalMessage(message)) return defaultFallback

  return message.length > 0 && message.length <= 160 ? message : defaultFallback
}

function friendlyFromText(message: string, context: UserErrorContext): string | null {
  const lower = message.toLowerCase()

  if (lower.includes('order not found') || lower.includes('beställningen hittades inte')) {
    return context === 'storefront' ? 'Beställningen hittades inte.' : 'Order not found.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('network') || lower.includes('fetch failed')) {
    return context === 'storefront'
      ? 'Kunde inte nå servern. Kontrollera anslutningen.'
      : 'Could not reach the server. Check your connection.'
  }

  return null
}

function isTechnicalMessage(message: string): boolean {
  return /violates .* constraint|duplicate key value|sqlstate|pgrst|insert or update on table|relation .* does not exist|idx_/i.test(
    message,
  )
}
