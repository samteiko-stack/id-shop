-- Extra discount is a percentage (shown on customer documents).
-- extra_discount_amount is the calculated value stored for totals.

ALTER TABLE orders
  DROP COLUMN IF EXISTS extra_discount_amount;

ALTER TABLE invoices
  DROP COLUMN IF EXISTS extra_discount_amount;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS extra_discount_rate NUMERIC(5, 2) DEFAULT 0 CHECK (extra_discount_rate >= 0 AND extra_discount_rate <= 100),
  ADD COLUMN IF NOT EXISTS extra_discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (extra_discount_amount >= 0);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS extra_discount_rate NUMERIC(5, 2) DEFAULT 0 CHECK (extra_discount_rate >= 0 AND extra_discount_rate <= 100),
  ADD COLUMN IF NOT EXISTS extra_discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (extra_discount_amount >= 0);

COMMENT ON COLUMN orders.extra_discount_rate IS 'Additional discount percentage shown explicitly on bill of sale and invoice';
COMMENT ON COLUMN orders.extra_discount_amount IS 'Calculated extra discount amount from net subtotal';
COMMENT ON COLUMN invoices.extra_discount_rate IS 'Additional discount percentage shown explicitly on invoice';
COMMENT ON COLUMN invoices.extra_discount_amount IS 'Calculated extra discount amount from net subtotal';
