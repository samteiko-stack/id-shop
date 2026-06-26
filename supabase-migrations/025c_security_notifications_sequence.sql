-- Part 3 of 3 — run after 025b succeeds

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "platform_update_notifications" ON public.notifications;

CREATE POLICY "platform_select_notifications" ON public.notifications
  FOR SELECT USING (public.is_platform_user());

CREATE POLICY "platform_update_notifications" ON public.notifications
  FOR UPDATE USING (public.current_user_role() IN ('admin', 'staff'));

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
