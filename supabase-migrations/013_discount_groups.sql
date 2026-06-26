-- Create discount_groups table
CREATE TABLE IF NOT EXISTS discount_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  discount_rate   NUMERIC(5, 2) NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 100),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Add discount_group_id to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS discount_group_id UUID REFERENCES discount_groups(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_groups_active
  ON discount_groups(is_active)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_discount_group
  ON customers(discount_group_id)
  WHERE discount_group_id IS NOT NULL AND deleted_at IS NULL;

-- RLS policies for discount_groups
ALTER TABLE discount_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON discount_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON discount_groups
  FOR ALL USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE discount_groups IS 'Customer discount tiers (VIP, Standard, etc.)';
COMMENT ON COLUMN discount_groups.name IS 'Discount group name (e.g., VIP, Standard, New Customer)';
COMMENT ON COLUMN discount_groups.discount_rate IS 'Discount percentage (0-100)';
COMMENT ON COLUMN discount_groups.description IS 'Internal description of this discount group';
COMMENT ON COLUMN discount_groups.is_active IS 'Whether this group is currently active';
COMMENT ON COLUMN customers.discount_group_id IS 'Assigned discount group for this customer';

-- Seed default discount groups
INSERT INTO discount_groups (name, discount_rate, description, is_active) VALUES
  ('Standard', 0, 'Default group with no discount', true),
  ('VIP', 15, 'VIP customers receive 15% discount', true),
  ('Wholesale', 20, 'Wholesale customers receive 20% discount', true)
ON CONFLICT DO NOTHING;
