-- Migration 011: Proper product_families table
-- Replaces free-text product_family field with structured FK

CREATE TABLE IF NOT EXISTS product_families (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url    TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_families_category_id_idx ON product_families(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS product_families_name_category_idx ON product_families(name, category_id);

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep updated_at current
DROP TRIGGER IF EXISTS product_families_updated_at ON product_families;
CREATE TRIGGER product_families_updated_at
  BEFORE UPDATE ON product_families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add family_id FK to products (keeps old product_family text for backwards compat)
ALTER TABLE products ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES product_families(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_family_id_idx ON products(family_id);

-- Migrate existing text-based product_family values into the new table
-- Groups by category_id + family name, creates a family record, then links products
DO $$
DECLARE
  r RECORD;
  fam_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT product_family, category_id
    FROM products
    WHERE product_family IS NOT NULL AND product_family != ''
  LOOP
    INSERT INTO product_families (name, category_id)
    VALUES (r.product_family, r.category_id)
    ON CONFLICT (name, category_id) DO NOTHING;

    SELECT id INTO fam_id FROM product_families WHERE name = r.product_family AND (category_id = r.category_id OR (category_id IS NULL AND r.category_id IS NULL)) LIMIT 1;

    UPDATE products SET family_id = fam_id
    WHERE product_family = r.product_family
      AND (category_id = r.category_id OR (category_id IS NULL AND r.category_id IS NULL));
  END LOOP;
END $$;

-- RLS
ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_families_public_read" ON product_families
  FOR SELECT USING (true);

CREATE POLICY "product_families_admin_staff_write" ON product_families
  FOR ALL USING (
    (auth.jwt() ->> 'role') IN ('admin', 'staff', 'service_role')
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );
