-- Restore order visibility for platform staff and storefront customers.
-- Safe to re-run if earlier migrations were partially applied.

DROP POLICY IF EXISTS "platform_select_orders" ON public.orders;
CREATE POLICY "platform_select_orders" ON public.orders
  FOR SELECT USING (public.is_platform_user() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "customers_select_own_orders" ON public.orders;
CREATE POLICY "customers_select_own_orders" ON public.orders
  FOR SELECT USING (
    public.current_user_role() = 'customer'
    AND deleted_at IS NULL
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customers_select_own_order_items" ON public.order_items;
CREATE POLICY "customers_select_own_order_items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id
      FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
        AND o.deleted_at IS NULL
    )
  );
