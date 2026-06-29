export type UserRole = 'admin' | 'staff' | 'read_only' | 'customer'

export type OrderStatus = 'draft' | 'confirmed' | 'fulfilled' | 'cancelled'
export type OrderSource = 'internal' | 'storefront'

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled'

export type CreditInvoiceStatus = 'draft' | 'issued' | 'applied'

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'VIEW'

/* ── Auth ── */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  full_name?: string
}

/* ── Database Row Types ── */
export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  invite_pending: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  display_style: 'list' | 'grouped'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductFamily {
  id: string
  name: string
  category_id: string | null
  image_url: string | null
  display_order: number
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name'>
}

export interface Product {
  id: string
  name: string
  secondary_name: string | null
  description: string | null
  invoice_notes: string | null
  slug: string | null
  ref: string
  category_id: string | null
  unit_price: number
  cost_price: number | null
  currency: string
  unit: string | null
  weight_kg: number | null
  is_active: boolean
  is_featured: boolean
  hide_in_shop: boolean
  is_promotional: boolean
  alert_quantity: number
  image_url: string | null
  product_family: string | null
  family_id: string | null
  display_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  category?: Category
  family?: ProductFamily
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  notes: string | null
  org_number: string | null
  contact_person: string | null
  website: string | null
  auth_user_id: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  source: OrderSource
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  customer?: Customer
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
  batches?: OrderItemBatch[]
}

export interface ProductBatch {
  id: string
  product_id: string
  ref: string
  lot_number: string
  expiry_date: string
  scanned_at: string
  scanned_by: string
  raw_qr_payload: string
  created_at: string
  product?: Product
}

export interface OrderItemBatch {
  id: string
  order_item_id: string
  batch_id: string
  quantity: number
  created_at: string
  batch?: ProductBatch
}

export interface Invoice {
  id: string
  invoice_number: string
  order_id: string | null
  customer_id: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  issue_date: string
  due_date: string | null
  pdf_url: string | null
  sent_at: string | null
  paid_at: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  customer?: Customer
  items?: InvoiceItem[]
  order?: Order
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
  product?: Product
}

export interface CreditInvoice {
  id: string
  credit_number: string
  invoice_id: string
  customer_id: string
  reason: string
  subtotal: number
  tax_amount: number
  total: number
  status: CreditInvoiceStatus
  pdf_url: string | null
  sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  customer?: Customer
  invoice?: Invoice
  items?: CreditInvoiceItem[]
}

export interface CreditInvoiceItem {
  id: string
  credit_invoice_id: string
  invoice_item_id: string | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: AuditAction
  changed_by: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user?: User
}

export interface Settings {
  key: string
  value: unknown
  updated_by: string | null
  updated_at: string
}

/* ── Traceability ── */
export interface TraceabilityResult {
  customer: Customer
  order: Order
  invoice: Invoice | null
  product: Product
  batch: ProductBatch
  quantity: number
}

/* ── Notifications ── */
export type NotificationType = 'new_order' | 'new_registration'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

/* ── Training Courses ── */
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseCategory = 'full_arch' | 'maxilla_for_all' | 'implantology' | 'surgery' | 'prosthetics' | 'other'

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  start_date: string
  end_date: string | null
  duration_days: number
  location: string
  country: string
  category: CourseCategory
  level: CourseLevel
  instructor_name: string | null
  instructor_bio: string | null
  image_url: string | null
  hubspot_form_code: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CourseTestimonial {
  id: string
  course_id: string
  participant_name: string
  participant_title: string | null
  feedback: string
  rating: number
  image_url: string | null
  created_at: string
}

/* ── News ── */
export interface NewsPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  image_url: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/* ── Payments ── */
export type PaymentMethod = 'bank_transfer' | 'check' | 'cash' | 'card' | 'swish' | 'other'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'credited' | 'refund_due' | 'not_invoiced'

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InvoiceWithPayments extends Invoice {
  paid_amount: number
  credit_total: number
  balance: number
  refund_due?: number
  payment_status: PaymentStatus
}

/* ── Pagination ── */
export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

/* ── API Response ── */
export interface ApiResponse<T = void> {
  data?: T
  error?: string
  details?: Record<string, string[]>
}
