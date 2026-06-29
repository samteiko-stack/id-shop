-- Remove unused product brand field (single-brand client)
DROP INDEX IF EXISTS idx_products_brand;
ALTER TABLE products DROP COLUMN IF EXISTS brand;
