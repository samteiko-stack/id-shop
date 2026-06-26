-- Allow storefront checkout to clear archive flag when confirming a draft sale.
-- Service-role submitCart must be able to set deleted_at = null on draft → confirmed.

CREATE OR REPLACE FUNCTION public.guard_order_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    -- Storefront cart submit: draft → confirmed should always become visible again.
    IF OLD.status = 'draft'
       AND NEW.status = 'confirmed'
       AND NEW.deleted_at IS NULL THEN
      RETURN NEW;
    END IF;

    IF public.current_user_role() NOT IN ('admin', 'staff') THEN
      RAISE EXCEPTION 'Only admins and staff can archive or restore sales';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Restore recent storefront sales that were archived but later re-submitted.
UPDATE public.orders
SET deleted_at = NULL, updated_at = now()
WHERE id IN (
  'f40ea086-c602-4938-a2a6-d1bf198744e1',
  'ebc681ef-e215-4276-8582-a9cdb66ff222'
)
AND deleted_at IS NOT NULL;
