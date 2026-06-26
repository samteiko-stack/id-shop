-- ────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor
-- ────────────────────────────────────────────

-- 1. Notifications table
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

-- 2. Add new fields to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS org_number     TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS website        TEXT;
