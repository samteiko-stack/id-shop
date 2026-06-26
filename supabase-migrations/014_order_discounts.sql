-- Add discount fields to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5, 2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (discount_amount >= 0);

-- Add discount fields to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5, 2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (discount_amount >= 0);

-- Comments
COMMENT ON COLUMN orders.discount_rate IS 'Percentage discount applied to this order (from customer discount group)';
COMMENT ON COLUMN orders.discount_amount IS 'Calculated discount amount in order currency';
COMMENT ON COLUMN invoices.discount_rate IS 'Percentage discount applied to this invoice (from customer discount group)';
COMMENT ON COLUMN invoices.discount_amount IS 'Calculated discount amount in invoice currency';
