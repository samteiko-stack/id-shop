-- Extra discount: optional amount shown explicitly on customer-facing documents.
-- General discount remains in discount_rate / discount_amount (baked into line prices).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS extra_discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (extra_discount_amount >= 0);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS extra_discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (extra_discount_amount >= 0);

COMMENT ON COLUMN orders.discount_rate IS 'General discount percentage — applied to line prices on customer documents (not shown as a separate line)';
COMMENT ON COLUMN orders.discount_amount IS 'Calculated general discount amount from list subtotal';
COMMENT ON COLUMN orders.extra_discount_amount IS 'Additional discount shown explicitly on bill of sale and invoice';

COMMENT ON COLUMN invoices.discount_rate IS 'General discount percentage — applied to line prices on customer documents (not shown as a separate line)';
COMMENT ON COLUMN invoices.discount_amount IS 'Calculated general discount amount from list subtotal';
COMMENT ON COLUMN invoices.extra_discount_amount IS 'Additional discount shown explicitly on invoice';
