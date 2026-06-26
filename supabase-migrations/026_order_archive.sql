-- Sales archive: read archived orders + allow staff/admin to archive/restore

DROP POLICY IF EXISTS "platform_select_archived_orders" ON public.orders;
CREATE POLICY "platform_select_archived_orders" ON public.orders
  FOR SELECT USING (
    public.is_platform_user()
    AND deleted_at IS NOT NULL
  );

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
