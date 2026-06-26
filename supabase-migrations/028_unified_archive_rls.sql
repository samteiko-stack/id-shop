-- Unified archive: platform staff can archive/restore and read archived rows

-- ── Orders ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_select_archived_orders" ON public.orders;
CREATE POLICY "platform_select_archived_orders" ON public.orders
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

DROP POLICY IF EXISTS "platform_update_orders" ON public.orders;
CREATE POLICY "platform_update_orders" ON public.orders
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "platform_delete_archived_orders" ON public.orders;
CREATE POLICY "platform_delete_archived_orders" ON public.orders
  FOR DELETE USING (
    public.current_user_role() = 'admin'
    AND deleted_at IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.guard_order_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     AND public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admins and staff can archive or restore sales';
  END IF;
  RETURN NEW;
END;
$$;

-- ── Products ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_select_archived_products" ON public.products;
CREATE POLICY "platform_select_archived_products" ON public.products
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

DROP POLICY IF EXISTS "platform_update_products" ON public.products;
CREATE POLICY "platform_update_products" ON public.products
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- ── Customers ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_select_archived_customers" ON public.customers;
CREATE POLICY "platform_select_archived_customers" ON public.customers
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

DROP POLICY IF EXISTS "platform_update_customers" ON public.customers;
CREATE POLICY "platform_update_customers" ON public.customers
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- ── Categories ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_select_archived_categories" ON public.categories;
CREATE POLICY "platform_select_archived_categories" ON public.categories
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

DROP POLICY IF EXISTS "platform_update_categories" ON public.categories;
CREATE POLICY "platform_update_categories" ON public.categories
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- ── Discount groups ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_select_archived_discount_groups" ON public.discount_groups;
CREATE POLICY "platform_select_archived_discount_groups" ON public.discount_groups
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

DROP POLICY IF EXISTS "platform_update_discount_groups" ON public.discount_groups;
CREATE POLICY "platform_update_discount_groups" ON public.discount_groups
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));
