-- ═══════════════════════════════════════════════════════════════
-- STOREFRONT MIGRATION
-- Migration: 002_storefront.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Add customer role ──
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';

-- ── Extend customers table ──
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_approved   boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user
  ON public.customers(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ── Add source to orders ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'internal'
    CHECK (source IN ('internal', 'storefront'));

-- ═══════════════════════════════════════════════════════════════
-- RLS — STOREFRONT CUSTOMER POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Customers can view their own orders
CREATE POLICY "customers_select_own_orders" ON public.orders
  FOR SELECT USING (
    public.current_user_role() = 'customer' AND
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- Approved customers can create draft orders
CREATE POLICY "customers_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'customer' AND
    status = 'draft' AND
    source = 'storefront' AND
    customer_id IN (
      SELECT id FROM public.customers
      WHERE auth_user_id = auth.uid() AND is_approved = true
    )
  );

-- Customers can update their own draft orders (add items / submit)
CREATE POLICY "customers_update_own_draft_orders" ON public.orders
  FOR UPDATE USING (
    public.current_user_role() = 'customer' AND
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- Customers can view their own order items
CREATE POLICY "customers_select_own_order_items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Approved customers can insert order items into their own draft orders
CREATE POLICY "customers_insert_order_items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
        AND c.is_approved = true
        AND o.status = 'draft'
    )
  );

-- Customers can remove items from their own draft orders
CREATE POLICY "customers_delete_own_order_items" ON public.order_items
  FOR DELETE USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid() AND o.status = 'draft'
    )
  );

-- Customers can view their own customer record (for profile / approval status)
CREATE POLICY "customers_select_own_record" ON public.customers
  FOR SELECT USING (auth_user_id = auth.uid());

-- Customers can view products and categories (already covered by existing policies
-- which check auth.uid() IS NOT NULL — customers are authenticated users)
