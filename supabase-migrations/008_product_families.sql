-- Add product family grouping and display options
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS product_family TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add display style to categories
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS display_style TEXT DEFAULT 'list';

-- Add check constraint for display_style
ALTER TABLE categories 
  ADD CONSTRAINT categories_display_style_check 
  CHECK (display_style IN ('list', 'grouped'));

-- Create index for product family queries
CREATE INDEX IF NOT EXISTS idx_products_product_family 
  ON products(product_family) 
  WHERE product_family IS NOT NULL AND deleted_at IS NULL;

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_products_display_order 
  ON products(display_order, created_at) 
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN products.product_family IS 'Groups related products together for grouped display (e.g., "RC Collagen" groups all RC Collagen variants)';
COMMENT ON COLUMN products.display_order IS 'Custom sort order for products within a category or family';
COMMENT ON COLUMN categories.display_style IS 'How to display products in this category: "list" for flat table, "grouped" for family grouping';
