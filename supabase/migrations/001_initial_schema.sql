-- ═══════════════════════════════════════════════════════════════
-- ID SHOP — INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ──
create extension if not exists "uuid-ossp";

-- ── Custom types / enums ──
create type user_role as enum ('admin', 'staff', 'read_only');
create type order_status as enum ('draft', 'confirmed', 'fulfilled', 'cancelled');
create type invoice_status as enum ('draft', 'issued', 'paid', 'cancelled');
create type credit_invoice_status as enum ('draft', 'issued', 'applied');
create type audit_action as enum ('INSERT', 'UPDATE', 'DELETE', 'VIEW');

-- ═══════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════

-- ── Users (mirrors auth.users) ──
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        user_role not null default 'read_only',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.users is 'Platform users. Role mirrored in auth.users.user_metadata.role for RLS.';

-- ── Categories ──
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references public.categories(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
comment on table public.categories is 'Product categories with optional parent for subcategories.';

-- ── Products ──
create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  ref         text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  unit_price  numeric(10,2) not null default 0,
  currency    text not null default 'EUR',
  is_active   boolean not null default true,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
comment on table public.products is 'Product catalog. REF matches supplier QR codes.';
create index idx_products_ref on public.products(ref) where deleted_at is null;
create index idx_products_category on public.products(category_id) where deleted_at is null;

-- ── Customers ──
create table public.customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text,
  phone       text,
  address     text,
  tax_id      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
comment on table public.customers is 'Customer database.';
create index idx_customers_name on public.customers(name) where deleted_at is null;
create index idx_customers_email on public.customers(email) where deleted_at is null;

-- ── Orders ──
create table public.orders (
  id           uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_id  uuid not null references public.customers(id),
  status       order_status not null default 'draft',
  notes        text,
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
comment on table public.orders is 'Customer orders.';
create index idx_orders_customer on public.orders(customer_id) where deleted_at is null;
create index idx_orders_status on public.orders(status) where deleted_at is null;
create index idx_orders_created_at on public.orders(created_at desc) where deleted_at is null;

-- ── Order Items ──
create table public.order_items (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity   integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);
comment on table public.order_items is 'Line items within an order. Price locked at time of order.';
create index idx_order_items_order on public.order_items(order_id);

-- ═══════════════════════════════════════════════════════════════
-- TRACEABILITY TABLES (immutable — no updates, no deletes)
-- ═══════════════════════════════════════════════════════════════

-- ── Product Batches (QR scan records) ──
create table public.product_batches (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references public.products(id),
  ref             text not null,
  lot_number      text not null,
  expiry_date     date not null,
  scanned_at      timestamptz not null default now(),
  scanned_by      uuid not null references public.users(id),
  raw_qr_payload  text not null,
  created_at      timestamptz not null default now()
  -- NO deleted_at — traceability records are immutable
);
comment on table public.product_batches is
  'Immutable QR scan records. Each row = one scanned product batch. Never update or delete.';
create index idx_product_batches_lot on public.product_batches(lot_number);
create index idx_product_batches_ref on public.product_batches(ref);
create index idx_product_batches_product on public.product_batches(product_id);
create index idx_product_batches_expiry on public.product_batches(expiry_date);

-- ── Order Item Batches (batch ↔ order item link) ──
create table public.order_item_batches (
  id            uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references public.order_items(id),
  batch_id      uuid not null references public.product_batches(id),
  quantity      integer not null check (quantity > 0),
  created_at    timestamptz not null default now()
  -- NO deleted_at — immutable
);
comment on table public.order_item_batches is
  'Immutable link between a scanned batch and an order item. Heart of traceability.';
create index idx_order_item_batches_item on public.order_item_batches(order_item_id);
create index idx_order_item_batches_batch on public.order_item_batches(batch_id);

-- ═══════════════════════════════════════════════════════════════
-- INVOICE TABLES
-- ═══════════════════════════════════════════════════════════════

-- ── Invoices ──
create table public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  order_id       uuid references public.orders(id),
  customer_id    uuid not null references public.customers(id),
  status         invoice_status not null default 'draft',
  subtotal       numeric(10,2) not null default 0,
  tax_rate       numeric(5,2) not null default 0,
  tax_amount     numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  currency       text not null default 'EUR',
  issue_date     date,
  due_date       date,
  pdf_url        text,
  sent_at        timestamptz,
  paid_at        timestamptz,
  notes          text,
  created_by     uuid not null references public.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
comment on table public.invoices is 'Invoices. issued invoices must not be modified (only admin can).';
create index idx_invoices_customer on public.invoices(customer_id) where deleted_at is null;
create index idx_invoices_order on public.invoices(order_id) where deleted_at is null;
create index idx_invoices_status on public.invoices(status) where deleted_at is null;
create index idx_invoices_issue_date on public.invoices(issue_date desc) where deleted_at is null;

-- ── Invoice Items ──
create table public.invoice_items (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  product_id  uuid references public.products(id),
  description text not null,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10,2) not null,
  line_total  numeric(10,2) not null,
  created_at  timestamptz not null default now()
);
create index idx_invoice_items_invoice on public.invoice_items(invoice_id);

-- ── Credit Invoices ──
create table public.credit_invoices (
  id            uuid primary key default uuid_generate_v4(),
  credit_number text not null unique,
  invoice_id    uuid not null references public.invoices(id),
  customer_id   uuid not null references public.customers(id),
  reason        text not null,
  subtotal      numeric(10,2) not null default 0,
  tax_amount    numeric(10,2) not null default 0,
  total         numeric(10,2) not null default 0,
  status        credit_invoice_status not null default 'draft',
  pdf_url       text,
  sent_at       timestamptz,
  created_by    uuid not null references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.credit_invoices is
  'Credit invoices (credit notes). Always linked to an original invoice. Original invoice is never modified.';
create index idx_credit_invoices_invoice on public.credit_invoices(invoice_id);
create index idx_credit_invoices_customer on public.credit_invoices(customer_id);

-- ── Credit Invoice Items ──
create table public.credit_invoice_items (
  id                uuid primary key default uuid_generate_v4(),
  credit_invoice_id uuid not null references public.credit_invoices(id) on delete cascade,
  invoice_item_id   uuid references public.invoice_items(id),
  description       text not null,
  quantity          integer not null check (quantity > 0),
  unit_price        numeric(10,2) not null,
  line_total        numeric(10,2) not null
);
create index idx_credit_invoice_items_credit on public.credit_invoice_items(credit_invoice_id);

-- ═══════════════════════════════════════════════════════════════
-- AUDIT & SETTINGS TABLES
-- ═══════════════════════════════════════════════════════════════

-- ── Audit Log (insert-only, never update, never delete) ──
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  table_name  text not null,
  record_id   uuid,
  action      audit_action not null,
  changed_by  uuid references public.users(id),
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);
comment on table public.audit_log is
  'Immutable audit trail. Never update or delete rows. Triggers auto-populate for all business tables.';
create index idx_audit_log_table_record on public.audit_log(table_name, record_id);
create index idx_audit_log_changed_by on public.audit_log(changed_by);
create index idx_audit_log_created_at on public.audit_log(created_at desc);

-- ── Sequence Counters (for sequential invoice/order numbers) ──
create table public.sequence_counters (
  id          text not null,
  year        integer not null,
  last_value  integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (id, year)
);
comment on table public.sequence_counters is
  'Sequential number counters. Use next_sequence_number() function to safely increment.';

-- Seed initial counters for current year
insert into public.sequence_counters (id, year, last_value) values
  ('order',   extract(year from now())::int, 0),
  ('invoice', extract(year from now())::int, 0),
  ('credit',  extract(year from now())::int, 0);

-- ── Settings ──
create table public.settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_by  uuid references public.users(id),
  updated_at  timestamptz not null default now()
);
comment on table public.settings is 'Key-value store for platform settings.';

-- Seed default settings
insert into public.settings (key, value) values
  ('company', '{"name": "ID Shop", "address": "", "tax_id": "", "phone": "", "email": "", "logo_url": ""}'),
  ('invoice', '{"default_tax_rate": 25, "payment_terms_days": 30, "notes_template": ""}'),
  ('notifications', '{"expiry_alert_days": [30, 60, 90]}');

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- ── Safe sequential number generation ──
create or replace function public.next_sequence_number(
  p_type text,
  p_prefix text
) returns text
language plpgsql
security definer
as $$
declare
  v_year    int := extract(year from now())::int;
  v_next    int;
  v_result  text;
begin
  -- Ensure row exists for current year
  insert into public.sequence_counters (id, year, last_value)
  values (p_type, v_year, 0)
  on conflict (id, year) do nothing;

  -- Atomically increment (row-level lock prevents race conditions)
  update public.sequence_counters
  set
    last_value = last_value + 1,
    updated_at = now()
  where id = p_type and year = v_year
  returning last_value into v_next;

  v_result := p_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
  return v_result;
end;
$$;
comment on function public.next_sequence_number is
  'Atomically generates the next sequential number. E.g. INV-2026-0042. Never call client-side.';

-- ── Auto-update updated_at ──
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

create trigger trg_credit_invoices_updated_at
  before update on public.credit_invoices
  for each row execute function public.handle_updated_at();

-- ── Audit log trigger function ──
create or replace function public.handle_audit_log()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (table_name, record_id, action, changed_by, new_data)
    values (tg_table_name, (to_jsonb(new)->>'id')::uuid, 'INSERT', auth.uid(), to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    values (tg_table_name, (to_jsonb(new)->>'id')::uuid, 'UPDATE', auth.uid(), to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (table_name, record_id, action, changed_by, old_data)
    values (tg_table_name, (to_jsonb(old)->>'id')::uuid, 'DELETE', auth.uid(), to_jsonb(old));
  end if;
  return coalesce(new, old);
end;
$$;

-- Apply audit triggers to all business tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'categories', 'products', 'customers',
    'orders', 'order_items', 'invoices', 'invoice_items',
    'credit_invoices', 'credit_invoice_items', 'settings'
  ] loop
    execute format(
      'create trigger trg_%s_audit
       after insert or update or delete on public.%s
       for each row execute function public.handle_audit_log()',
      t, t
    );
  end loop;
end;
$$;

-- ── Auto-create user profile on signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.users (id, email, full_name, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      coalesce((new.raw_user_meta_data->>'role')::user_role, 'read_only')
    )
    on conflict (id) do nothing;
  exception when others then
    null;
  end;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.users             enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.customers         enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.product_batches   enable row level security;
alter table public.order_item_batches enable row level security;
alter table public.invoices          enable row level security;
alter table public.invoice_items     enable row level security;
alter table public.credit_invoices   enable row level security;
alter table public.credit_invoice_items enable row level security;
alter table public.audit_log         enable row level security;
alter table public.sequence_counters enable row level security;
alter table public.settings          enable row level security;

-- ── Helper: get current user role from JWT ──
create or replace function public.current_user_role()
returns text language sql stable as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'read_only'
  )
$$;

-- ══════════════════════════════════
-- USERS
-- ══════════════════════════════════
create policy "users_select_admin" on public.users
  for select using (public.current_user_role() = 'admin');

create policy "users_insert_admin" on public.users
  for insert with check (public.current_user_role() = 'admin');

create policy "users_update_admin" on public.users
  for update using (public.current_user_role() = 'admin');

-- Allow users to read their own profile
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

-- ══════════════════════════════════
-- CATEGORIES
-- ══════════════════════════════════
-- Public read: storefront visitors (including anonymous) can browse categories
create policy "categories_select" on public.categories
  for select using (deleted_at is null);

create policy "categories_insert" on public.categories
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "categories_update" on public.categories
  for update using (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- PRODUCTS
-- ══════════════════════════════════
-- Public read: storefront visitors (including anonymous) can browse active products
create policy "products_select" on public.products
  for select using (deleted_at is null);

create policy "products_insert" on public.products
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "products_update" on public.products
  for update using (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- CUSTOMERS
-- ══════════════════════════════════
create policy "customers_select" on public.customers
  for select using (auth.uid() is not null and deleted_at is null);

create policy "customers_insert" on public.customers
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "customers_update" on public.customers
  for update using (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- ORDERS
-- ══════════════════════════════════
create policy "orders_select" on public.orders
  for select using (auth.uid() is not null and deleted_at is null);

create policy "orders_insert" on public.orders
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "orders_update" on public.orders
  for update using (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════
create policy "order_items_select" on public.order_items
  for select using (auth.uid() is not null);

create policy "order_items_insert" on public.order_items
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "order_items_update" on public.order_items
  for update using (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- PRODUCT BATCHES (immutable)
-- ══════════════════════════════════
create policy "product_batches_select" on public.product_batches
  for select using (auth.uid() is not null);

create policy "product_batches_insert" on public.product_batches
  for insert with check (public.current_user_role() in ('admin', 'staff'));
-- NO UPDATE or DELETE policies — denied by default

-- ══════════════════════════════════
-- ORDER ITEM BATCHES (immutable)
-- ══════════════════════════════════
create policy "order_item_batches_select" on public.order_item_batches
  for select using (auth.uid() is not null);

create policy "order_item_batches_insert" on public.order_item_batches
  for insert with check (public.current_user_role() in ('admin', 'staff'));
-- NO UPDATE or DELETE policies — denied by default

-- ══════════════════════════════════
-- INVOICES
-- ══════════════════════════════════
create policy "invoices_select" on public.invoices
  for select using (auth.uid() is not null and deleted_at is null);

create policy "invoices_insert" on public.invoices
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "invoices_update" on public.invoices
  for update using (public.current_user_role() = 'admin');

-- ══════════════════════════════════
-- INVOICE ITEMS
-- ══════════════════════════════════
create policy "invoice_items_select" on public.invoice_items
  for select using (auth.uid() is not null);

create policy "invoice_items_insert" on public.invoice_items
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "invoice_items_update" on public.invoice_items
  for update using (public.current_user_role() = 'admin');

-- ══════════════════════════════════
-- CREDIT INVOICES
-- ══════════════════════════════════
create policy "credit_invoices_select" on public.credit_invoices
  for select using (auth.uid() is not null);

create policy "credit_invoices_insert" on public.credit_invoices
  for insert with check (public.current_user_role() in ('admin', 'staff'));

create policy "credit_invoices_update" on public.credit_invoices
  for update using (public.current_user_role() = 'admin');

-- ══════════════════════════════════
-- CREDIT INVOICE ITEMS
-- ══════════════════════════════════
create policy "credit_invoice_items_select" on public.credit_invoice_items
  for select using (auth.uid() is not null);

create policy "credit_invoice_items_insert" on public.credit_invoice_items
  for insert with check (public.current_user_role() in ('admin', 'staff'));

-- ══════════════════════════════════
-- AUDIT LOG (insert-only for triggers, read admin only)
-- ══════════════════════════════════
create policy "audit_log_select" on public.audit_log
  for select using (public.current_user_role() = 'admin');
-- INSERT handled by triggers using security definer — no user-level INSERT policy needed

-- ══════════════════════════════════
-- SEQUENCE COUNTERS (server-side only via function)
-- ══════════════════════════════════
create policy "sequence_counters_none" on public.sequence_counters
  for all using (false);
-- next_sequence_number() uses security definer — bypasses RLS

-- ══════════════════════════════════
-- SETTINGS
-- ══════════════════════════════════
create policy "settings_select" on public.settings
  for select using (auth.uid() is not null);

create policy "settings_update" on public.settings
  for update using (public.current_user_role() = 'admin');

create policy "settings_insert" on public.settings
  for insert with check (public.current_user_role() = 'admin');
