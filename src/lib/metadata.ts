import type { Metadata } from 'next'

/** Standard page metadata — title is combined with root template: "%s | ID Shop" */
export function pageMetadata(title: string, description: string): Metadata {
  return { title, description }
}

export const platformMeta = {
  dashboard: pageMetadata(
    'Dashboard',
    'Overview of sales, revenue, inventory alerts, and recent platform activity.',
  ),
  sales: pageMetadata(
    'Sales',
    'View and manage customer sales, order status, invoices, and payment balances.',
  ),
  archivedSales: pageMetadata(
    'Archived Sales',
    'Restore archived sales or permanently delete them when allowed.',
  ),
  archive: pageMetadata(
    'Archive',
    'Restore archived sales, products, customers, categories, and content.',
  ),
  newSale: pageMetadata(
    'New Sale',
    'Create a new manual sale for a customer.',
  ),
  saleDetail: (orderNumber: string, customerName?: string | null) =>
    pageMetadata(
      orderNumber,
      customerName
        ? `View sale ${orderNumber} for ${customerName} — line items, invoices, and fulfillment.`
        : `View sale ${orderNumber} — line items, customer, invoices, and fulfillment.`,
    ),
  editSale: (orderNumber: string) =>
    pageMetadata(
      `Edit ${orderNumber}`,
      `Update line items and details for sale ${orderNumber}.`,
    ),
  printSale: (orderNumber: string, customerName?: string | null) =>
    pageMetadata(
      `Print ${orderNumber}`,
      customerName
        ? `Print sale ${orderNumber} for ${customerName}.`
        : `Print sale ${orderNumber}.`,
    ),
  invoices: pageMetadata(
    'Invoices',
    'Manage issued invoices, payment status, and customer balances.',
  ),
  invoiceDetail: (invoiceNumber: string, customerName?: string | null) =>
    pageMetadata(
      invoiceNumber,
      customerName
        ? `Invoice ${invoiceNumber} for ${customerName}.`
        : `Invoice ${invoiceNumber} details and payments.`,
    ),
  creditInvoices: pageMetadata(
    'Credit Invoices',
    'View and create credit notes against existing invoices.',
  ),
  newCreditInvoice: pageMetadata(
    'New Credit Invoice',
    'Issue a credit note linked to an original invoice.',
  ),
  creditInvoiceDetail: (creditNumber: string) =>
    pageMetadata(
      creditNumber,
      `Credit note ${creditNumber} — reason, line items, and linked invoice.`,
    ),
  customers: pageMetadata(
    'Customers',
    'Manage customer accounts, approvals, and discount groups.',
  ),
  customerDetail: (name: string) =>
    pageMetadata(
      name,
      `Customer profile for ${name} — orders, invoices, and account details.`,
    ),
  products: pageMetadata(
    'Products',
    'Manage product catalog, pricing, categories, and availability.',
  ),
  productDetail: (name: string, ref?: string | null) =>
    pageMetadata(
      ref ? `${name} (${ref})` : name,
      ref
        ? `Product ${ref} — details, batches, and order history.`
        : `Product details, batches, and order history.`,
    ),
  categories: pageMetadata(
    'Categories',
    'Organise the product catalog into top-level categories.',
  ),
  subcategories: pageMetadata(
    'Sub-categories',
    'Manage sub-categories nested under main categories.',
  ),
  families: pageMetadata(
    'Product Families',
    'Group related products into families for the storefront.',
  ),
  discountGroups: pageMetadata(
    'Discount Groups',
    'Configure customer discount rates and assigned accounts.',
  ),
  discountGroupDetail: (name: string) =>
    pageMetadata(
      name,
      `Discount group ${name} — rate, customers, and settings.`,
    ),
  programs: pageMetadata(
    'Programs',
    'Manage training courses and educational programs.',
  ),
  news: pageMetadata(
    'News',
    'Publish and manage news articles for the storefront.',
  ),
  traceability: pageMetadata(
    'Traceability',
    'Scan and assign product LOT numbers to sales for compliance.',
  ),
  reports: pageMetadata(
    'Reports',
    'Sales, inventory, and expiry reports for the business.',
  ),
  settings: pageMetadata(
    'Settings',
    'Company details, invoice defaults, and platform configuration.',
  ),
  users: pageMetadata(
    'User Management',
    'Manage admin and staff accounts, roles, and access.',
  ),
  auditLog: pageMetadata(
    'Audit Log',
    'Review recorded changes across the platform.',
  ),
} as const

export const shopMeta = {
  home: pageMetadata(
    'Hem',
    'ID Shop – medicinska och dentala förbrukningsartiklar för kliniker i Sverige.',
  ),
  catalog: pageMetadata(
    'Sortiment',
    'Bläddra i ID Shops sortiment av medicinska och dentala produkter.',
  ),
  categories: pageMetadata(
    'Alla kategorier',
    'Utforska alla produktkategorier i ID Shops sortiment.',
  ),
  category: (name: string) =>
    pageMetadata(
      name,
      `Visa ${name} – produkter och underkategorier hos ID Shop.`,
    ),
  product: (name: string, ref?: string | null) =>
    pageMetadata(
      name,
      ref
        ? `${name} (${ref}) – beställ från ID Shop.`
        : `${name} – beställ från ID Shop.`,
    ),
  cart: pageMetadata(
    'Varukorg',
    'Granska och slutför din beställning hos ID Shop.',
  ),
  account: pageMetadata(
    'Mitt konto',
    'Hantera ditt företagskonto, beställningar och fakturor hos ID Shop.',
  ),
  orderDetail: (orderNumber: string) =>
    pageMetadata(
      orderNumber,
      `Beställning ${orderNumber} – status och radartiklar.`,
    ),
  invoiceDetail: (invoiceNumber: string) =>
    pageMetadata(
      invoiceNumber,
      `Faktura ${invoiceNumber} – belopp, status och PDF.`,
    ),
  programs: pageMetadata(
    'Program',
    'Utbildningar och program från ID Shop för kliniker och tandvård.',
  ),
  programDetail: (title: string, description?: string | null) =>
    pageMetadata(
      title,
      description?.slice(0, 160) ?? `Läs mer om ${title} hos ID Shop.`,
    ),
  news: pageMetadata(
    'Nyheter',
    'Senaste nytt från ID Shop – produktnyheter och branschuppdateringar.',
  ),
  newsDetail: (title: string, excerpt?: string | null) =>
    pageMetadata(
      title,
      excerpt?.slice(0, 160) ?? `Artikel från ID Shop: ${title}.`,
    ),
  about: pageMetadata(
    'Om oss',
    'Lär känna ID Shop – din partner för medicinska och dentala förbrukningsartiklar i Sverige.',
  ),
  login: pageMetadata(
    'Logga in',
    'Logga in på ditt ID Shop-konto för att se priser och beställa.',
  ),
  register: pageMetadata(
    'Registrera konto',
    'Registrera ditt företag som kund hos ID Shop.',
  ),
  resetPassword: pageMetadata(
    'Återställ lösenord',
    'Begär en länk för att återställa ditt ID Shop-lösenord.',
  ),
  updatePassword: pageMetadata(
    'Nytt lösenord',
    'Ange ett nytt lösenord för ditt ID Shop-konto.',
  ),
  pendingApproval: pageMetadata(
    'Väntar på godkännande',
    'Ditt konto granskas. Du får tillgång till priser och beställning när det är godkänt.',
  ),
  authCallback: pageMetadata(
    'Autentisering',
    'Slutför inloggning till ID Shop.',
  ),
} as const

export const authMeta = {
  login: pageMetadata(
    'Log in',
    'Sign in to the ID Shop admin platform.',
  ),
  resetPassword: pageMetadata(
    'Reset password',
    'Request a password reset link for your ID Shop admin account.',
  ),
} as const
