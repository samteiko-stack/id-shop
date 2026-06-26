import type { Metadata } from 'next'

const SITE_NAME = 'ID Shop'

/** Standard page metadata — title is combined with root template: "%s | ID Shop" */
export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: 'website',
    },
  }
}

export const platformMeta = {
  dashboard: pageMetadata(
    'Business Dashboard & KPIs',
    'Overview of monthly sales, revenue, inventory alerts, low-stock products, and recent platform activity for your medical supply business.',
  ),
  sales: pageMetadata(
    'Sales & Order Management',
    'View and manage customer sales, order status, fulfillment, linked invoices, and payment balances in one place.',
  ),
  archivedSales: pageMetadata(
    'Archived Sales',
    'Restore archived sales or permanently delete them when allowed by traceability and payment rules.',
  ),
  archive: pageMetadata(
    'Archive — Restore Records',
    'Restore archived sales, products, customers, categories, discount groups, news posts, and training programs.',
  ),
  newSale: pageMetadata(
    'Create New Sale',
    'Create a new manual sale for a B2B customer with line items, pricing, and discounts.',
  ),
  saleDetail: (orderNumber: string, customerName?: string | null) =>
    pageMetadata(
      customerName ? `Sale ${orderNumber} — ${customerName}` : `Sale ${orderNumber}`,
      customerName
        ? `View sale ${orderNumber} for ${customerName} — line items, invoices, fulfillment status, and LOT traceability.`
        : `View sale ${orderNumber} — line items, customer details, invoices, and fulfillment.`,
    ),
  editSale: (orderNumber: string) =>
    pageMetadata(
      `Edit Sale ${orderNumber}`,
      `Update line items, pricing, and customer details for sale ${orderNumber}.`,
    ),
  printSale: (orderNumber: string, customerName?: string | null) =>
    pageMetadata(
      customerName ? `Print Sale ${orderNumber} — ${customerName}` : `Print Sale ${orderNumber}`,
      customerName
        ? `Print sale ${orderNumber} for ${customerName} — order summary for internal or customer records.`
        : `Print sale ${orderNumber} — order summary and line items.`,
    ),
  invoices: pageMetadata(
    'Invoices & Accounts Receivable',
    'Manage issued invoices, record payments, track outstanding balances, and send invoices to customers.',
  ),
  invoiceDetail: (invoiceNumber: string, customerName?: string | null) =>
    pageMetadata(
      customerName ? `Invoice ${invoiceNumber} — ${customerName}` : `Invoice ${invoiceNumber}`,
      customerName
        ? `Invoice ${invoiceNumber} for ${customerName} — amounts, payment status, credits, and PDF.`
        : `Invoice ${invoiceNumber} — line items, payment history, and settlement status.`,
    ),
  creditInvoices: pageMetadata(
    'Credit Notes & Adjustments',
    'View and create credit notes against existing invoices for returns, corrections, and billing adjustments.',
  ),
  newCreditInvoice: pageMetadata(
    'Issue Credit Note',
    'Create a credit note linked to an original invoice with reason and line-item adjustments.',
  ),
  creditInvoiceDetail: (creditNumber: string) =>
    pageMetadata(
      `Credit Note ${creditNumber}`,
      `Credit note ${creditNumber} — reason, credited line items, and linked original invoice.`,
    ),
  customers: pageMetadata(
    'Customer Accounts & Approvals',
    'Manage B2B customer accounts, registration approvals, contact details, and discount group assignments.',
  ),
  customerDetail: (name: string) =>
    pageMetadata(
      `${name} — Customer Profile`,
      `Customer profile for ${name} — sales history, invoices, discount group, and account settings.`,
    ),
  products: pageMetadata(
    'Product Catalog & Pricing',
    'Manage medical and dental products, pricing, categories, availability, and storefront visibility.',
  ),
  productDetail: (name: string, ref?: string | null) =>
    pageMetadata(
      ref ? `${name} (${ref})` : `${name} — Product Details`,
      ref
        ? `Product ${ref} (${name}) — pricing, inventory alerts, LOT batches, and order history.`
        : `Product details for ${name} — pricing, batches, and order history.`,
    ),
  categories: pageMetadata(
    'Product Categories',
    'Organise the medical and dental product catalog into top-level categories for the storefront.',
  ),
  subcategories: pageMetadata(
    'Product Sub-categories',
    'Manage sub-categories nested under main categories to structure the product catalog.',
  ),
  families: pageMetadata(
    'Product Families & Grouping',
    'Group related products into families for clearer navigation on the B2B storefront.',
  ),
  discountGroups: pageMetadata(
    'Customer Discount Groups',
    'Configure B2B discount rates and assign customer accounts to pricing groups.',
  ),
  discountGroupDetail: (name: string) =>
    pageMetadata(
      `${name} — Discount Group`,
      `Discount group "${name}" — rate, assigned customers, and pricing settings.`,
    ),
  programs: pageMetadata(
    'Training Programs & Courses',
    'Manage clinical training courses, workshops, and educational programs for the storefront.',
  ),
  news: pageMetadata(
    'News & Storefront Content',
    'Publish and manage news articles, product updates, and industry content for the public website.',
  ),
  traceability: pageMetadata(
    'LOT Traceability & QR Scanning',
    'Scan and assign product LOT numbers to sales for regulatory traceability and batch tracking.',
  ),
  reports: pageMetadata(
    'Sales & Inventory Reports',
    'Business reports for revenue, order volume, top products, customer spend, VAT, and batch expiry.',
  ),
  settings: pageMetadata(
    'Company & Platform Settings',
    'Configure company details, invoice defaults, tax settings, and platform preferences.',
  ),
  users: pageMetadata(
    'Staff & User Management',
    'Manage admin and staff accounts, roles, invitations, and platform access permissions.',
  ),
  auditLog: pageMetadata(
    'Audit Log & Change History',
    'Review recorded changes across orders, products, customers, and other platform records.',
  ),
} as const

export const shopMeta = {
  home: pageMetadata(
    'Medicinska & dentala förbrukningsartiklar',
    'ID Shop levererar certifierade medicinska och dentala förbrukningsartiklar till kliniker, tandvård och sjukvård i Sverige. Beställ online som företagskund.',
  ),
  catalog: pageMetadata(
    'Produktkatalog för klinik & tandvård',
    'Bläddra i ID Shops sortiment av medicinska och dentala produkter. Sök efter namn eller REF och beställ som godkänd företagskund.',
  ),
  categories: pageMetadata(
    'Alla produktkategorier',
    'Utforska alla produktkategorier i ID Shops sortiment — medicinska och dentala förbrukningsartiklar för kliniker i Sverige.',
  ),
  category: (name: string) =>
    pageMetadata(
      `${name} — medicinska & dentala produkter`,
      `Beställ ${name.toLowerCase()} från ID Shop. Certifierade förbrukningsartiklar för kliniker och tandvårdsteam i Sverige.`,
    ),
  product: (name: string, ref?: string | null) =>
    pageMetadata(
      ref ? `${name} (${ref})` : name,
      ref
        ? `Beställ ${name} (${ref}) — medicinsk/dental förbrukningsartikel från ID Shop med snabb leverans till kliniker.`
        : `Beställ ${name} — medicinska och dentala förbrukningsartiklar från ID Shop för kliniker i Sverige.`,
    ),
  cart: pageMetadata(
    'Varukorg & beställning',
    'Granska valda produkter, uppdatera kvantiteter och slutför din B2B-beställning hos ID Shop.',
  ),
  account: pageMetadata(
    'Mitt företagskonto',
    'Hantera ditt företagskonto hos ID Shop — se beställningar, fakturor, kontaktuppgifter och orderhistorik.',
  ),
  orderDetail: (orderNumber: string) =>
    pageMetadata(
      `Beställning ${orderNumber}`,
      `Beställning ${orderNumber} hos ID Shop — status, radartiklar och leveransinformation för ditt företag.`,
    ),
  invoiceDetail: (invoiceNumber: string) =>
    pageMetadata(
      `Faktura ${invoiceNumber}`,
      `Faktura ${invoiceNumber} från ID Shop — belopp, betalningsstatus och PDF för ditt företag.`,
    ),
  programs: pageMetadata(
    'Utbildningar & kurser för klinik',
    'Praktiska utbildningar och program från ID Shop för tandläkare, klinikpersonal och medicinsk vård.',
  ),
  programDetail: (title: string, description?: string | null) =>
    pageMetadata(
      `${title} — utbildning`,
      description?.slice(0, 160) ?? `Läs mer om utbildningen ${title} hos ID Shop — datum, plats och anmälan.`,
    ),
  news: pageMetadata(
    'Nyheter & branschuppdateringar',
    'Senaste nytt från ID Shop — produktnyheter, branschuppdateringar och tips för kliniker och tandvård.',
  ),
  newsDetail: (title: string, excerpt?: string | null) =>
    pageMetadata(
      title,
      excerpt?.slice(0, 160) ?? `${title} — artikel från ID Shop om medicinsk och dental försörjning.`,
    ),
  about: pageMetadata(
    'Om ID Shop — medicinsk försörjning',
    'Lär känna ID Shop — din partner för certifierade medicinska och dentala förbrukningsartiklar till kliniker i Sverige.',
  ),
  login: pageMetadata(
    'Logga in som företagskund',
    'Logga in på ditt ID Shop-konto för att se priser, lägga beställningar och hantera fakturor.',
  ),
  register: pageMetadata(
    'Registrera företagskonto',
    'Registrera ditt företag som B2B-kund hos ID Shop och få tillgång till sortiment och priser efter godkännande.',
  ),
  resetPassword: pageMetadata(
    'Återställ lösenord',
    'Begär en säker länk för att återställa lösenordet till ditt ID Shop-konto.',
  ),
  updatePassword: pageMetadata(
    'Välj nytt lösenord',
    'Ange ett nytt lösenord för ditt ID Shop-konto efter inbjudan eller återställning.',
  ),
  pendingApproval: pageMetadata(
    'Konto väntar på godkännande',
    'Ditt företagskonto granskas av ID Shop. Du får tillgång till priser och beställning när det är godkänt.',
  ),
  authCallback: pageMetadata(
    'Slutför inloggning',
    'Slutför inloggning till ID Shop och fortsätt till ditt konto.',
  ),
} as const

export const authMeta = {
  login: pageMetadata(
    'Admin Login',
    'Sign in to the ID Shop admin platform to manage sales, inventory, customers, and invoices.',
  ),
  resetPassword: pageMetadata(
    'Reset Admin Password',
    'Request a secure password reset link for your ID Shop admin account.',
  ),
} as const

export const platformRobots: Metadata['robots'] = { index: false, follow: false }
export const storefrontRobots: Metadata['robots'] = { index: true, follow: true }
export const authRobots: Metadata['robots'] = { index: false, follow: false }

/** Merge noindex robots into page metadata (login, password reset, etc.) */
export function withNoIndex(meta: Metadata): Metadata {
  return { ...meta, robots: authRobots }
}
