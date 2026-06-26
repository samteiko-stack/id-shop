-- Fix payments RLS: use app role from user_metadata, not Supabase auth role
DROP POLICY IF EXISTS "Admin and staff can manage payments" ON payments;
DROP POLICY IF EXISTS "Read-only can view payments" ON payments;

CREATE POLICY "Admin and staff can manage payments"
  ON payments FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Read-only can view payments"
  ON payments FOR SELECT
  USING (public.current_user_role() = 'read_only');
