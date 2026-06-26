'use server'

import { z } from 'zod'
import { createCookieClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'
import { requireAdminAccess } from '@/lib/auth/permissions'
import { revalidateDashboard } from '@/lib/platform/revalidate-platform'
import { computeOrderTotals } from '@/lib/discounts'

// ── Registration ──────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  first_name:   z.string().min(1, 'Förnamn krävs'),
  last_name:    z.string().min(1, 'Efternamn krävs'),
  company:      z.string().min(1, 'Företagsnamn krävs'),
  org_number:   z.string().min(1, 'Organisationsnummer krävs'),
  tax_id:       z.string().optional(),
  address:      z.string().optional(),
  website:      z.string().optional(),
  phone:        z.string().min(1, 'Telefon krävs'),
  email:        z.string().email('Ogiltig e-postadress'),
  password:     z.string()
    .min(8, 'Lösenordet måste ha minst 8 tecken')
    .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en versal')
    .regex(/[a-z]/, 'Lösenordet måste innehålla minst en gemen')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Lösenorden matchar inte',
  path: ['confirm_password'],
})

export async function registerCustomer(formData: FormData) {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter' }
  }

  const { first_name, last_name, company, org_number, tax_id, address, website, email, phone, password } = parsed.data
  const contactPerson = `${first_name} ${last_name}`.trim()
  const admin = await createAdminClient()

  // Create auth user with customer role
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'customer', full_name: contactPerson },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Det finns redan ett konto med den e-postadressen.' }
    }
    return { error: authError.message }
  }

  // Create customer record linked to auth user (not approved yet)
  const { error: customerError } = await admin
    .from('customers')
    .insert({
      name: company,
      email,
      phone: phone || null,
      address: address || null,
      tax_id: tax_id || null,
      org_number: org_number || null,
      contact_person: contactPerson,
      website: website || null,
      auth_user_id: authData.user.id,
      is_approved: false,
    })

  if (customerError) {
    // Rollback: delete auth user
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Det gick inte att skapa kundposten. Försök igen.' }
  }

  // Ensure public.users row exists (trigger may fail silently on enum/other errors)
  const { error: profileError } = await admin.from('users').upsert(
    {
      id: authData.user.id,
      email,
      full_name: contactPerson,
      role: 'customer',
    },
    { onConflict: 'id' },
  )
  if (profileError) {
    await admin.from('customers').delete().eq('auth_user_id', authData.user.id)
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Det gick inte att skapa användarprofilen. Försök igen.' }
  }

  await createNotification({
    type: 'new_registration',
    title: `New registration: ${company}`,
    body: `${contactPerson} (${org_number}) has registered and is awaiting approval.`,
    link: '/customers',
  })

  return { success: true }
}

// ── Cart operations ───────────────────────────────────────────────────────────

async function ensureCustomerPublicUser(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  email: string | undefined,
  fullName: string | undefined,
) {
  const { data: profile } = await admin.from('users').select('id').eq('id', userId).maybeSingle()
  if (profile) return null

  const { error } = await admin.from('users').upsert(
    {
      id: userId,
      email: email ?? '',
      full_name: fullName ?? email ?? 'Customer',
      role: 'customer',
    },
    { onConflict: 'id' },
  )
  return error?.message ?? null
}

async function getCustomerDiscountRate(supabase: Awaited<ReturnType<typeof createCookieClient>>, customerId: string) {
  const { data: customer } = await supabase
    .from('customers')
    .select('discount_group:discount_groups(discount_rate)')
    .eq('id', customerId)
    .single()

  return Number((customer?.discount_group as { discount_rate?: number } | null)?.discount_rate ?? 0)
}

async function syncDraftOrderDiscount(
  supabase: Awaited<ReturnType<typeof createCookieClient>>,
  orderId: string,
  discountRate: number,
) {
  const { data: items } = await supabase
    .from('order_items')
    .select('quantity, unit_price')
    .eq('order_id', orderId)

  const totals = computeOrderTotals({
    items: items ?? [],
    discount_rate: discountRate,
    extra_discount_rate: 0,
  })

  await supabase
    .from('orders')
    .update({
      discount_rate: totals.discountRate,
      discount_amount: totals.generalDiscountAmount,
      extra_discount_rate: 0,
      extra_discount_amount: 0,
    })
    .eq('id', orderId)
}

async function getOrCreateDraftOrder(
  supabase: Awaited<ReturnType<typeof createCookieClient>>,
  customerId: string,
  userId: string,
  userEmail?: string,
  userFullName?: string,
) {
  const discountRate = await getCustomerDiscountRate(supabase, customerId)

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'draft')
    .eq('source', 'storefront')
    .maybeSingle()

  if (existing) {
    await syncDraftOrderDiscount(supabase, existing.id, discountRate)
    return { orderId: existing.id, error: null }
  }

  const admin = await createAdminClient()
  const profileError = await ensureCustomerPublicUser(admin, userId, userEmail, userFullName)
  if (profileError) return { orderId: null, error: profileError }

  const { data: counter } = await admin.rpc('next_sequence_number', {
    p_type: 'order',
    p_prefix: 'ORD',
  })

  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      order_number: counter ?? `ORD-DRAFT-${Date.now()}`,
      customer_id: customerId,
      status: 'draft',
      source: 'storefront',
      created_by: userId,
      discount_rate: discountRate,
      discount_amount: 0,
      extra_discount_rate: 0,
      extra_discount_amount: 0,
    })
    .select('id')
    .single()

  if (error) return { orderId: null, error: error.message }
  return { orderId: newOrder.id, error: null }
}

export async function addToCart(productId: string, quantity: number) {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, is_approved')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer?.is_approved) return { error: 'Your account is pending approval.' }

  const { data: product } = await supabase
    .from('products')
    .select('id, unit_price')
    .eq('id', productId)
    .single()

  if (!product) return { error: 'Product not found.' }

  const { orderId, error: orderError } = await getOrCreateDraftOrder(
    supabase,
    customer.id,
    user.id,
    user.email,
    user.user_metadata?.full_name,
  )
  if (orderError || !orderId) return { error: orderError ?? 'Failed to create cart.' }

  const qty = Math.max(1, Math.floor(quantity))

  const { data: existing, error: existingError } = await supabase
    .from('order_items')
    .select('id, quantity')
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }

  if (existing) {
    const { error: updateError } = await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + qty })
      .eq('id', existing.id)

    if (updateError) return { error: updateError.message }
  } else {
    const { error: insertError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: productId,
        quantity: qty,
        unit_price: product.unit_price,
      })

    if (insertError) {
      // Race: another request inserted the same product — merge quantities
      if (insertError.code === '23505') {
        const { data: raced } = await supabase
          .from('order_items')
          .select('id, quantity')
          .eq('order_id', orderId)
          .eq('product_id', productId)
          .maybeSingle()

        if (!raced) return { error: insertError.message }

        const { error: mergeError } = await supabase
          .from('order_items')
          .update({ quantity: raced.quantity + qty })
          .eq('id', raced.id)

        if (mergeError) return { error: mergeError.message }
      } else {
        return { error: insertError.message }
      }
    }
  }

  const discountRate = await getCustomerDiscountRate(supabase, customer.id)
  await syncDraftOrderDiscount(supabase, orderId, discountRate)

  revalidatePath('/shop')
  revalidatePath('/shop/cart')
  return { success: true }
}

export async function updateCartItem(orderItemId: string, quantity: number) {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: item } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', orderItemId)
    .single()

  if (quantity <= 0) {
    const { error } = await supabase.from('order_items').delete().eq('id', orderItemId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('order_items').update({ quantity }).eq('id', orderItemId)
    if (error) return { error: error.message }
  }

  if (item?.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', item.order_id)
      .single()

    if (order?.customer_id) {
      const discountRate = await getCustomerDiscountRate(supabase, order.customer_id)
      await syncDraftOrderDiscount(supabase, item.order_id, discountRate)
    }
  }

  revalidatePath('/shop/cart')
  return { success: true }
}

export async function submitCart() {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) return { error: 'Customer record not found.' }

  const { data: draftOrder } = await supabase
    .from('orders')
    .select('id, order_items(id)')
    .eq('customer_id', customer.id)
    .eq('status', 'draft')
    .eq('source', 'storefront')
    .maybeSingle()

  if (!draftOrder) return { error: 'Your cart is empty.' }
  if (!draftOrder.order_items?.length) return { error: 'Your cart is empty.' }

  const admin = await createAdminClient()
  const { data: confirmed, error } = await admin
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', draftOrder.id)
    .eq('customer_id', customer.id)
    .eq('status', 'draft')
    .select('id, order_number, customers(name)')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!confirmed) return { error: 'Order could not be confirmed. Please try again.' }

  const customerName = (confirmed.customers as { name?: string } | null)?.name ?? 'Unknown customer'
  const orderNumber = confirmed.order_number ?? ''

  await createNotification({
    type: 'new_order',
    title: `New order ${orderNumber}`,
    body: `${customerName} placed an order via the storefront.`,
    link: `/orders/${draftOrder.id}`,
  })

  revalidatePath('/shop/cart')
  revalidatePath('/shop')
  revalidatePath('/orders')
  revalidateDashboard()
  return { success: true, orderId: draftOrder.id }
}

export async function reorderOrder(orderId: string) {
  const supabase = await createCookieClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Du måste vara inloggad.' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, is_approved')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer?.is_approved) return { error: 'Ditt konto väntar på godkännande.' }

  const { data: originalOrder } = await supabase
    .from('orders')
    .select('id, order_number, order_items(product_id, quantity)')
    .eq('id', orderId)
    .eq('customer_id', customer.id)
    .is('deleted_at', null)
    .neq('status', 'draft')
    .single()

  if (!originalOrder) return { error: 'Beställningen hittades inte.' }

  const rawItems = (originalOrder.order_items ?? []) as { product_id: string; quantity: number }[]
  if (!rawItems.length) return { error: 'Beställningen har inga rader.' }

  const qtyByProduct = new Map<string, number>()
  for (const item of rawItems) {
    qtyByProduct.set(item.product_id, (qtyByProduct.get(item.product_id) ?? 0) + item.quantity)
  }

  const productIds = [...qtyByProduct.keys()]
  const { data: products } = await supabase
    .from('products')
    .select('id, unit_price, name, is_active, hide_in_shop')
    .in('id', productIds)
    .is('deleted_at', null)

  const productMap = new Map(products?.map((p) => [p.id, p]) ?? [])
  const skipped: string[] = []
  const lineItems: { product_id: string; quantity: number; unit_price: number }[] = []

  for (const [productId, quantity] of qtyByProduct) {
    const product = productMap.get(productId)
    if (!product || !product.is_active || product.hide_in_shop) {
      skipped.push(product?.name ?? 'Okänd produkt')
      continue
    }
    lineItems.push({
      product_id: productId,
      quantity,
      unit_price: Number(product.unit_price),
    })
  }

  if (!lineItems.length) {
    return { error: 'Inga produkter i beställningen är tillgängliga längre.' }
  }

  const { orderId: draftOrderId, error: orderError } = await getOrCreateDraftOrder(
    supabase,
    customer.id,
    user.id,
    user.email,
    user.user_metadata?.full_name,
  )
  if (orderError || !draftOrderId) return { error: orderError ?? 'Kunde inte skapa beställning.' }

  await supabase.from('order_items').delete().eq('order_id', draftOrderId)

  const { error: itemsError } = await supabase.from('order_items').insert(
    lineItems.map((item) => ({ ...item, order_id: draftOrderId })),
  )
  if (itemsError) return { error: itemsError.message }

  const discountRate = await getCustomerDiscountRate(supabase, customer.id)
  await syncDraftOrderDiscount(supabase, draftOrderId, discountRate)

  revalidatePath('/shop/cart')
  revalidatePath('/shop')
  revalidatePath('/shop/konto')

  return {
    success: true,
    itemCount: lineItems.length,
    skippedProducts: skipped.length > 0 ? skipped : undefined,
  }
}

// ── Admin: approve / reject customer ─────────────────────────────────────────

export async function approveCustomer(customerId: string) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createCookieClient()
  const { error } = await supabase
    .from('customers')
    .update({ is_approved: true })
    .eq('id', customerId)
  if (error) return { error: error.message }
  revalidatePath('/customers')
  revalidateDashboard()
  return { success: true }
}

export async function rejectCustomer(customerId: string) {
  const auth = await requireAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createCookieClient()
  const admin = await createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('auth_user_id')
    .eq('id', customerId)
    .single()

  await supabase.from('customers').delete().eq('id', customerId)
  if (customer?.auth_user_id) {
    await admin.auth.admin.deleteUser(customer.auth_user_id)
  }

  revalidatePath('/customers')
  revalidateDashboard()
  return { success: true }
}
