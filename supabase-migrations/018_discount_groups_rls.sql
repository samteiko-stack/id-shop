-- Restrict discount_groups writes to admin/staff (read_only is view-only)
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON discount_groups;

CREATE POLICY "Staff and admin can insert discount_groups" ON discount_groups
  FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff and admin can update discount_groups" ON discount_groups
  FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));
