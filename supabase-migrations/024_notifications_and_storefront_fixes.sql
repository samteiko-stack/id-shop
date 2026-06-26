-- Notifications table + storefront backfill for customer orders

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_is_read_idx
  ON public.notifications (is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_type_created_idx
  ON public.notifications (type, created_at DESC);

-- ── Storefront columns (idempotent) ──────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_approved   boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user
  ON public.customers(auth_user_id) WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'internal';

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_source_check CHECK (source IN ('internal', 'storefront'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Backfill public.users for auth users missing a profile ───────────────────
INSERT INTO public.users (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', au.email),
  coalesce((au.raw_user_meta_data->>'role')::user_role, 'read_only'::user_role)
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ── Storefront RLS (recreate so migration is safe to re-run) ─────────────────
DROP POLICY IF EXISTS "customers_select_own_orders" ON public.orders;
CREATE POLICY "customers_select_own_orders" ON public.orders
  FOR SELECT USING (
    public.current_user_role() = 'customer' AND
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customers_insert_orders" ON public.orders;
CREATE POLICY "customers_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'customer' AND
    status = 'draft' AND
    source = 'storefront' AND
    customer_id IN (
      SELECT id FROM public.customers
      WHERE auth_user_id = auth.uid() AND is_approved = true
    )
  );

DROP POLICY IF EXISTS "customers_update_own_draft_orders" ON public.orders;
CREATE POLICY "customers_update_own_draft_orders" ON public.orders
  FOR UPDATE USING (
    public.current_user_role() = 'customer' AND
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'customer' AND
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customers_select_own_order_items" ON public.order_items;
CREATE POLICY "customers_select_own_order_items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customers_insert_order_items" ON public.order_items;
CREATE POLICY "customers_insert_order_items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
        AND c.is_approved = true
        AND o.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "customers_delete_own_order_items" ON public.order_items;
CREATE POLICY "customers_delete_own_order_items" ON public.order_items
  FOR DELETE USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid() AND o.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "customers_select_own_record" ON public.customers;
CREATE POLICY "customers_select_own_record" ON public.customers
  FOR SELECT USING (auth_user_id = auth.uid());
