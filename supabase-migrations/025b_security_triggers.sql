-- Part 2 of 3 — run after 025a succeeds

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
