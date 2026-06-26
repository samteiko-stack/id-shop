-- Allow admin/staff to remove or replace a wrong trace assignment.
-- Original product_batches rows stay for audit; only order_item_batches links are removed.

DROP POLICY IF EXISTS "platform_delete_order_item_batches" ON public.order_item_batches;
CREATE POLICY "platform_delete_order_item_batches" ON public.order_item_batches
  FOR DELETE USING (public.current_user_role() IN ('admin', 'staff'));
