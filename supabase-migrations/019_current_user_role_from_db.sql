-- Use public.users.role as source of truth for RLS (matches app permissions layer)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role::text FROM public.users WHERE id = auth.uid()),
    auth.jwt() -> 'user_metadata' ->> 'role',
    'read_only'
  )
$$;
