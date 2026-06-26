-- Part 1 of 3 — run first in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.is_platform_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('admin', 'staff', 'read_only')
$$;

DROP POLICY IF EXISTS "customers_select" ON public.customers;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "credit_invoices_select" ON public.credit_invoices;
DROP POLICY IF EXISTS "credit_invoice_items_select" ON public.credit_invoice_items;
DROP POLICY IF EXISTS "product_batches_select" ON public.product_batches;
DROP POLICY IF EXISTS "order_item_batches_select" ON public.order_item_batches;
DROP POLICY IF EXISTS "settings_select" ON public.settings;

DROP POLICY IF EXISTS "platform_select_customers" ON public.customers;
CREATE POLICY "platform_select_customers" ON public.customers
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "platform_select_orders" ON public.orders;
CREATE POLICY "platform_select_orders" ON public.orders
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "platform_select_invoices" ON public.invoices;
CREATE POLICY "platform_select_invoices" ON public.invoices
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "platform_select_order_items" ON public.order_items;
CREATE POLICY "platform_select_order_items" ON public.order_items
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_invoice_items" ON public.invoice_items;
CREATE POLICY "platform_select_invoice_items" ON public.invoice_items
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_credit_invoices" ON public.credit_invoices;
CREATE POLICY "platform_select_credit_invoices" ON public.credit_invoices
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_credit_invoice_items" ON public.credit_invoice_items;
CREATE POLICY "platform_select_credit_invoice_items" ON public.credit_invoice_items
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_product_batches" ON public.product_batches;
CREATE POLICY "platform_select_product_batches" ON public.product_batches
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_order_item_batches" ON public.order_item_batches;
CREATE POLICY "platform_select_order_item_batches" ON public.order_item_batches
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "platform_select_settings" ON public.settings;
CREATE POLICY "platform_select_settings" ON public.settings
  FOR SELECT USING (public.is_platform_user());

DROP POLICY IF EXISTS "customers_select_own_invoices" ON public.invoices;
CREATE POLICY "customers_select_own_invoices" ON public.invoices
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND deleted_at IS NULL
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customers_select_own_invoice_items" ON public.invoice_items;
CREATE POLICY "customers_select_own_invoice_items" ON public.invoice_items
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND invoice_id IN (
      SELECT i.id
      FROM public.invoices i
      JOIN public.customers c ON c.id = i.customer_id
      WHERE c.auth_user_id = auth.uid()
        AND i.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.discount_groups;

DROP POLICY IF EXISTS "platform_select_discount_groups" ON public.discount_groups;
CREATE POLICY "platform_select_discount_groups" ON public.discount_groups
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "customers_select_own_discount_group" ON public.discount_groups;
CREATE POLICY "customers_select_own_discount_group" ON public.discount_groups
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND deleted_at IS NULL
    AND id IN (
      SELECT discount_group_id FROM public.customers
      WHERE auth_user_id = auth.uid() AND discount_group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "customers_update_own_draft_orders" ON public.orders;

CREATE POLICY "customers_update_own_draft_orders" ON public.orders
  FOR UPDATE USING (
    public.current_user_role() = 'customer'
    AND status = 'draft'
    AND source = 'storefront'
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'customer'
    AND status = 'draft'
    AND source = 'storefront'
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );
