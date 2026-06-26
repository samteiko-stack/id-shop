-- Migration 010: Ensure categories have slug column
-- The slug is needed for storefront URL routing

-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug TEXT;
    -- Populate from name for existing rows
    UPDATE categories SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
END $$;

-- Ensure unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);

-- Ensure products.hide_in_shop defaults to false
ALTER TABLE products ALTER COLUMN hide_in_shop SET DEFAULT false;
UPDATE products SET hide_in_shop = false WHERE hide_in_shop IS NULL;

COMMENT ON COLUMN categories.slug IS 'URL-safe identifier for storefront routing';
