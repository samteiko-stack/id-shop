-- Pending platform invites until the user accepts and sets a password.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS invite_pending boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.invite_pending IS
  'True while a platform invite email is outstanding; cleared when the user completes signup.';

-- New auth users with platform roles start as inactive pending invite acceptance.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  is_platform_role boolean;
BEGIN
  assigned_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'read_only');
  is_platform_role := assigned_role IN ('admin', 'staff', 'read_only');

  BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_active, invite_pending)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      assigned_role,
      NOT is_platform_role,
      is_platform_role
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN others THEN
    NULL;
  END;

  RETURN new;
END;
$$;
