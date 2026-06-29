-- EMERGENCY ONLY: run this if production still queries products.brand
-- but migration 035 already dropped the column (products look "gone").
-- After Vercel deploys the brand-removal code, this column is unused again.
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
CREATE INDEX IF NOT EXISTS idx_products_brand
  ON products(brand)
  WHERE brand IS NOT NULL AND deleted_at IS NULL;
