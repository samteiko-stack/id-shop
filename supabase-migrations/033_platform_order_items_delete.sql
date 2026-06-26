-- Platform staff must be able to replace order lines when editing a sale.
-- Without this, DELETE is blocked by RLS, re-insert hits idx_order_items_order_product.

DROP POLICY IF EXISTS "order_items_delete" ON public.order_items;
CREATE POLICY "order_items_delete" ON public.order_items
  FOR DELETE USING (public.current_user_role() IN ('admin', 'staff'));
