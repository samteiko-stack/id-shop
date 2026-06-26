-- Security hardening: RLS isolation, customer tamper guards, notifications, sequence RPC

-- ── Helpers ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('admin', 'staff', 'read_only')
$$;

-- ── Drop overly broad SELECT policies (OR-combined with scoped policies) ─────
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

-- ── Platform staff read access ────────────────────────────────────────────────
CREATE POLICY "platform_select_customers" ON public.customers
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

CREATE POLICY "platform_select_orders" ON public.orders
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

CREATE POLICY "platform_select_invoices" ON public.invoices
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

CREATE POLICY "platform_select_order_items" ON public.order_items
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_invoice_items" ON public.invoice_items
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_credit_invoices" ON public.credit_invoices
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_credit_invoice_items" ON public.credit_invoice_items
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_product_batches" ON public.product_batches
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_order_item_batches" ON public.order_item_batches
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_select_settings" ON public.settings
  FOR SELECT USING (public.is_platform_user());

-- ── Customer scoped invoice read (account pages) ──────────────────────────────
CREATE POLICY "customers_select_own_invoices" ON public.invoices
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND deleted_at IS NULL
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

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

-- ── Discount groups: platform + own group only for customers ──────────────────
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.discount_groups;

CREATE POLICY "platform_select_discount_groups" ON public.discount_groups
  FOR SELECT USING (
    public.is_platform_user() AND deleted_at IS NULL
  );

CREATE POLICY "customers_select_own_discount_group" ON public.discount_groups
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND deleted_at IS NULL
    AND id IN (
      SELECT discount_group_id FROM public.customers
      WHERE auth_user_id = auth.uid() AND discount_group_id IS NOT NULL
    )
  );

-- ── Customer order updates: draft storefront orders only ─────────────────────
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

-- ── Block customers from changing sensitive customer fields ───────────────────
CREATE OR REPLACE FUNCTION public.guard_customer_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() = 'customer' AND OLD.auth_user_id = auth.uid() THEN
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved
       OR NEW.discount_group_id IS DISTINCT FROM OLD.discount_group_id
       OR NEW.notes IS DISTINCT FROM OLD.notes
       OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       OR NEW.org_number IS DISTINCT FROM OLD.org_number THEN
      RAISE EXCEPTION 'Customers cannot modify protected account fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_customer_self_update ON public.customers;
CREATE TRIGGER trg_guard_customer_self_update
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_self_update();

-- ── Block customers from changing cart line prices ────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_customer_order_item_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() = 'customer' THEN
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.order_id IS DISTINCT FROM OLD.order_id THEN
      RAISE EXCEPTION 'Customers cannot modify line item price or product';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_customer_order_item_update ON public.order_items;
CREATE TRIGGER trg_guard_customer_order_item_update
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_order_item_update();

-- ── Notifications RLS ───────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "platform_update_notifications" ON public.notifications;

CREATE POLICY "platform_select_notifications" ON public.notifications
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_update_notifications" ON public.notifications
  FOR UPDATE USING (public.current_user_role() IN ('admin', 'staff'));

-- Inserts are server-side via service role; no user INSERT policy

-- ── Restrict sequence RPC to platform users (service_role allowed) ────────────
CREATE OR REPLACE FUNCTION public.next_sequence_number(
  p_type text,
  p_prefix text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year    int := extract(year from now())::int;
  v_next    int;
  v_result  text;
  v_jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  IF v_jwt_role = 'authenticated'
     AND public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_jwt_role NOT IN ('service_role', 'authenticated') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.sequence_counters (id, year, last_value)
  VALUES (p_type, v_year, 0)
  ON CONFLICT (id, year) DO NOTHING;

  UPDATE public.sequence_counters
  SET
    last_value = last_value + 1,
    updated_at = now()
  WHERE id = p_type AND year = v_year
  RETURNING last_value INTO v_next;

  v_result := p_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.next_sequence_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_sequence_number(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_sequence_number(text, text) TO service_role;

-- ── Only admins may soft-delete orders ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_order_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     AND public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete orders';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_order_soft_delete ON public.orders;
CREATE TRIGGER trg_guard_order_soft_delete
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_soft_delete();
