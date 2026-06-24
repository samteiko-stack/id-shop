-- Extended product fields to match legacy system
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug             TEXT,
  ADD COLUMN IF NOT EXISTS secondary_name   TEXT,
  ADD COLUMN IF NOT EXISTS brand            TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg        NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS unit             TEXT,
  ADD COLUMN IF NOT EXISTS cost_price       NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS alert_quantity   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_in_shop     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_promotional   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_notes    TEXT;

-- Unique slug per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug
  ON products(slug)
  WHERE slug IS NOT NULL AND deleted_at IS NULL;

-- Indexes for common shop queries
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products(is_featured)
  WHERE is_featured = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand
  ON products(brand)
  WHERE brand IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN products.slug             IS 'URL-friendly identifier';
COMMENT ON COLUMN products.secondary_name   IS 'Alternative/secondary product name';
COMMENT ON COLUMN products.brand            IS 'Brand/supplier name (e.g. ACE, J Dental Care)';
COMMENT ON COLUMN products.weight_kg        IS 'Product weight in kilograms';
COMMENT ON COLUMN products.unit             IS 'Unit of measure (e.g. st, box, pack)';
COMMENT ON COLUMN products.cost_price       IS 'Purchase/cost price (internal use only)';
COMMENT ON COLUMN products.alert_quantity   IS 'Stock level that triggers low-stock alert';
COMMENT ON COLUMN products.is_featured      IS 'Show on shop homepage';
COMMENT ON COLUMN products.hide_in_shop     IS 'Hide from public shop (admin-only ordering)';
COMMENT ON COLUMN products.is_promotional   IS 'Currently on promotion/discount';
COMMENT ON COLUMN products.invoice_notes    IS 'Additional notes printed on invoices for this product';
