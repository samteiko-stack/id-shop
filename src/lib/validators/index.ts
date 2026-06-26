import { z } from 'zod'
import { DEFAULT_VAT_RATE } from '@/lib/tax'

/* ── Category ── */
export const categorySchema = z.object({
  name:          z.string().min(1, 'Name is required').max(100),
  slug:          z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  parent_id:     z.string().uuid().nullable().optional(),
  image_url:     z.string().url().nullable().optional(),
  display_style: z.enum(['list', 'grouped']).default('list'),
})
export type CategoryInput = z.infer<typeof categorySchema>

/* ── Product ── */
export const productSchema = z.object({
  name:            z.string().min(1, 'Name is required').max(200),
  secondary_name:  z.string().max(200).nullable().optional(),
  description:     z.string().max(2000).nullable().optional(),
  invoice_notes:   z.string().max(1000).nullable().optional(),
  slug:            z.string().max(200).regex(/^[a-z0-9-]*$/, 'Lowercase, numbers, hyphens only').nullable().optional(),
  ref:             z.string().min(1, 'REF is required').max(100),
  brand:           z.string().max(200).nullable().optional(),
  category_id:     z.string().uuid().nullable().optional(),
  unit_price:      z.number().min(0, 'Price must be positive'),
  cost_price:      z.number().min(0).nullable().optional(),
  currency:        z.string().length(3).default('SEK'),
  unit:            z.string().max(50).nullable().optional(),
  weight_kg:       z.number().min(0).nullable().optional(),
  is_active:       z.boolean().default(true),
  is_featured:     z.boolean().default(false),
  hide_in_shop:    z.boolean().default(false),
  is_promotional:  z.boolean().default(false),
  alert_quantity:  z.number().int().min(0).default(0),
  image_url:       z.string().url().nullable().optional(),
  product_family:  z.string().max(200).nullable().optional(),
  family_id:       z.string().uuid().nullable().optional(),
  display_order:   z.number().int().min(0).default(0),
})
export type ProductInput = z.infer<typeof productSchema>

/* ── Product Family ── */
export const productFamilySchema = z.object({
  name:         z.string().min(1, 'Name is required').max(200),
  category_id:  z.string().uuid().nullable().optional(),
  image_url:    z.string().url().nullable().optional(),
  display_order: z.number().int().min(0).default(0),
})
export type ProductFamilyInput = z.infer<typeof productFamilySchema>

/* ── Customer ── */
export const customerSchema = z.object({
  name:              z.string().min(1, 'Name is required').max(200),
  email:             z.string().email().optional().nullable().or(z.literal('')),
  phone:             z.string().max(50).optional().nullable(),
  address:           z.string().max(500).optional().nullable(),
  tax_id:            z.string().max(50).optional().nullable(),
  notes:             z.string().max(2000).optional().nullable(),
  org_number:        z.string().max(50).optional().nullable(),
  contact_person:    z.string().max(200).optional().nullable(),
  website:           z.string().max(200).optional().nullable(),
  discount_group_id: z.string().uuid().optional().nullable(),
})

/** Fields a storefront customer may edit on their own profile */
export const customerProfileSchema = customerSchema.pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  tax_id: true,
  org_number: true,
  contact_person: true,
  website: true,
})
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>

export type CustomerInput = z.infer<typeof customerSchema>

/* ── Discount Group ── */
export const discountGroupSchema = z.object({
  name:          z.string().min(1, 'Name is required').max(200),
  discount_rate: z.number().min(0, 'Discount rate cannot be negative').max(100, 'Discount rate cannot exceed 100'),
  description:   z.string().max(500).optional().nullable(),
  is_active:     z.boolean().default(true),
})
export type DiscountGroupInput = z.infer<typeof discountGroupSchema>

/* ── Order ── */
export const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  quantity:   z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0),
})

export const orderSchema = z.object({
  customer_id: z.string().uuid('Customer is required'),
  notes:       z.string().max(2000).optional().nullable(),
  items:       z.array(orderItemSchema).min(1, 'At least one item is required'),
  extra_discount_rate: z.number().min(0).max(100).optional(),
})
export type OrderInput = z.infer<typeof orderSchema>

/* ── Invoice ── */
export const invoiceItemSchema = z.object({
  product_id:  z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity:    z.number().int().min(1),
  unit_price:  z.number().min(0),
})

export const invoiceSchema = z.object({
  order_id:    z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid('Customer is required'),
  tax_rate:    z.number().min(0).max(100).default(DEFAULT_VAT_RATE),
  currency:    z.string().length(3).default('SEK'),
  issue_date:  z.string().date(),
  due_date:    z.string().date().optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
  items:       z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})
export type InvoiceInput = z.infer<typeof invoiceSchema>

/* ── Credit Invoice ── */
export const creditInvoiceItemSchema = z.object({
  invoice_item_id: z.string().uuid().optional().nullable(),
  description:     z.string().min(1).max(500),
  quantity:        z.number().int().min(1),
  unit_price:      z.number().min(0),
})

export const creditInvoiceSchema = z.object({
  invoice_id: z.string().uuid('Original invoice is required'),
  reason:     z.string().min(1, 'Reason is required').max(500),
  items:      z.array(creditInvoiceItemSchema).min(1),
})
export type CreditInvoiceInput = z.infer<typeof creditInvoiceSchema>

/* ── News ── */
function newsBodyHasContent(val: string) {
  return val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
}

export const newsPostSchema = z.object({
  title:        z.string().min(1, 'Title is required').max(200),
  slug:         z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  excerpt:      z.string().max(500).optional().nullable(),
  body:         z.string().max(50000),
  image_url:    z.string().url().optional().nullable().or(z.literal('')),
  is_published: z.boolean(),
  published_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')
    .optional()
    .nullable(),
}).refine(
  (data) => !data.is_published || newsBodyHasContent(data.body),
  { message: 'Body is required to publish', path: ['body'] },
).refine(
  (data) => !data.is_published || !!data.published_at,
  { message: 'Publish date is required when publishing', path: ['published_at'] },
)
export type NewsPostInput = z.infer<typeof newsPostSchema>

/* ── QR Batch ── */
export const productBatchSchema = z.object({
  product_id:     z.string().uuid('Product is required'),
  order_item_id:  z.string().uuid('Order item is required'),
  ref:            z.string().min(1, 'REF is required'),
  lot_number:     z.string().min(1, 'LOT number is required'),
  expiry_date:    z.string().date('Valid expiry date is required'),
  raw_qr_payload: z.string().min(1),
  quantity:       z.number().int().min(1),
})
export type ProductBatchInput = z.infer<typeof productBatchSchema>
