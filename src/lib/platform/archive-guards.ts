import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

type GuardResult = { error?: string; warnings?: string[] }

function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`)
}

export async function getCategoryArchiveBlockers(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<GuardResult> {
  const [
    { count: productCount },
    { count: subcategoryCount },
    { count: familyCount },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null),
    supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', categoryId)
      .is('deleted_at', null),
    supabase
      .from('product_families')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId),
  ])

  if ((productCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${productCount} active ${plural(productCount!, 'product')} still use this category. Reassign or archive them first.`,
    }
  }
  if ((subcategoryCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${subcategoryCount} active sub-${plural(subcategoryCount!, 'category', 'categories')} still use this category. Archive them first.`,
    }
  }
  if ((familyCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${familyCount} product ${plural(familyCount!, 'family', 'families')} linked to this category. Remove or reassign them first.`,
    }
  }
  return {}
}

export async function getCategoryRestoreBlockers(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<GuardResult> {
  const { data: category } = await supabase
    .from('categories')
    .select('id, parent_id')
    .eq('id', categoryId)
    .not('deleted_at', 'is', null)
    .single()

  if (!category?.parent_id) return {}

  const { data: parent } = await supabase
    .from('categories')
    .select('id, name, deleted_at')
    .eq('id', category.parent_id)
    .single()

  if (parent?.deleted_at) {
    return {
      error: `Cannot restore: parent category "${parent.name}" is still archived. Restore it first.`,
    }
  }
  return {}
}

export async function getDiscountGroupArchiveBlockers(
  supabase: SupabaseClient,
  groupId: string,
): Promise<GuardResult> {
  const { count } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('discount_group_id', groupId)
    .is('deleted_at', null)

  if ((count ?? 0) > 0) {
    return {
      error: `Cannot archive: ${count} active ${plural(count!, 'customer')} assigned to this discount group. Reassign them first.`,
    }
  }
  return {}
}

export async function getCustomerArchiveBlockers(
  supabase: SupabaseClient,
  customerId: string,
): Promise<GuardResult> {
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, auth_user_id')
    .eq('id', customerId)
    .is('deleted_at', null)
    .single()

  if (!customer) return { error: 'Customer not found' }

  if (customer.auth_user_id) {
    return {
      error: 'Cannot archive: this customer has a storefront login. Unlink or deactivate their account first.',
    }
  }

  const [
    { count: orderCount },
    { count: invoiceCount },
    { count: creditCount },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .neq('status', 'cancelled'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .in('status', ['draft', 'issued']),
    supabase
      .from('credit_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('status', 'applied'),
  ])

  if ((orderCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${orderCount} active ${plural(orderCount!, 'sale')} linked to this customer. Archive or cancel them first.`,
    }
  }
  if ((invoiceCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${invoiceCount} open ${plural(invoiceCount!, 'invoice')} linked to this customer. Settle or cancel them first.`,
    }
  }
  if ((creditCount ?? 0) > 0) {
    return {
      error: `Cannot archive: ${creditCount} active credit ${plural(creditCount!, 'note', 'notes')} linked to this customer.`,
    }
  }
  return {}
}

export async function getCustomerRestoreBlockers(
  supabase: SupabaseClient,
  customerId: string,
): Promise<GuardResult> {
  const { data: customer } = await supabase
    .from('customers')
    .select('id, discount_group_id')
    .eq('id', customerId)
    .not('deleted_at', 'is', null)
    .single()

  if (!customer?.discount_group_id) return {}

  const { data: group } = await supabase
    .from('discount_groups')
    .select('id, name, deleted_at')
    .eq('id', customer.discount_group_id)
    .single()

  if (group?.deleted_at) {
    return {
      error: `Cannot restore: discount group "${group.name}" is still archived. Restore it first.`,
    }
  }
  return {}
}

export async function getProductArchiveBlockers(
  supabase: SupabaseClient,
  productId: string,
): Promise<GuardResult> {
  const { data: openOrders } = await supabase
    .from('orders')
    .select('id, order_number')
    .is('deleted_at', null)
    .in('status', ['draft', 'confirmed'])

  const openOrderIds = openOrders?.map((o) => o.id) ?? []
  if (openOrderIds.length === 0) return {}

  const { data: items } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('product_id', productId)
    .in('order_id', openOrderIds)

  const count = items?.length ?? 0
  if (count > 0) {
    const firstOrderId = items![0].order_id
    const sample = openOrders?.find((o) => o.id === firstOrderId)?.order_number
    const suffix = sample ? ` (e.g. ${sample})` : ''
    return {
      error: `Cannot archive: this product is on ${count} open ${plural(count, 'sale')}${suffix}. Complete or cancel them first.`,
    }
  }
  return {}
}

export async function getProductRestoreBlockers(
  supabase: SupabaseClient,
  productId: string,
): Promise<GuardResult> {
  const { data: product } = await supabase
    .from('products')
    .select('id, category_id, family_id')
    .eq('id', productId)
    .not('deleted_at', 'is', null)
    .single()

  if (!product) return {}

  if (product.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, deleted_at')
      .eq('id', product.category_id)
      .single()

    if (category?.deleted_at) {
      return {
        error: `Cannot restore: category "${category.name}" is still archived. Restore it first.`,
      }
    }
  }

  if (product.family_id) {
    const { data: family } = await supabase
      .from('product_families')
      .select('id, name')
      .eq('id', product.family_id)
      .maybeSingle()

    if (!family) {
      return {
        error: 'Cannot restore: the linked product family no longer exists. Reassign the product first.',
      }
    }
  }

  return {}
}

export async function getProductFamilyDeleteBlockers(
  supabase: SupabaseClient,
  familyId: string,
): Promise<GuardResult> {
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .is('deleted_at', null)

  if ((count ?? 0) > 0) {
    return {
      error: `Cannot delete: ${count} active ${plural(count!, 'product')} still use this family. Reassign or archive them first.`,
    }
  }
  return {}
}

export async function getOrderArchiveBlockers(
  supabase: SupabaseClient,
  orderId: string,
  role: UserRole,
): Promise<GuardResult> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (!order) return { error: 'Sale not found or already archived' }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status')
    .eq('order_id', orderId)
    .is('deleted_at', null)
    .neq('status', 'cancelled')

  const activeInvoices = invoices ?? []
  const warnings: string[] = []

  if (activeInvoices.length > 0) {
    const labels = activeInvoices.map((i) => i.invoice_number).join(', ')
    warnings.push(`Linked invoice(s): ${labels}.`)

    const invoiceIds = activeInvoices.map((i) => i.id)
    const { count: paymentCount } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .in('invoice_id', invoiceIds)
      .is('deleted_at', null)

    if ((paymentCount ?? 0) > 0) {
      warnings.push(`${paymentCount} payment record${paymentCount === 1 ? '' : 's'} recorded on linked invoice(s).`)
    }
  }

  if (order.status === 'fulfilled' && activeInvoices.length > 0 && role !== 'admin') {
    return {
      error: 'Cannot archive: fulfilled sales with invoices can only be archived by an admin.',
      warnings,
    }
  }

  if (warnings.length > 0) {
    return { warnings }
  }

  return {}
}

export function formatArchiveWarnings(warnings: string[] | undefined, baseDescription: string) {
  if (!warnings?.length) return baseDescription
  return `${baseDescription}\n\n${warnings.join(' ')}`
}
