-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'card', 'swish', 'other')),
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admin/staff can manage payments
CREATE POLICY "Admin and staff can manage payments"
  ON payments FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- Read-only can view payments
CREATE POLICY "Read-only can view payments"
  ON payments FOR SELECT
  USING (public.current_user_role() = 'read_only');

-- Function to get invoice payment summary
CREATE OR REPLACE FUNCTION get_invoice_payment_summary(invoice_uuid UUID)
RETURNS TABLE (
  total_amount NUMERIC,
  paid_amount NUMERIC,
  balance NUMERIC,
  payment_status TEXT
) AS $$
DECLARE
  v_total NUMERIC;
  v_paid NUMERIC;
  v_balance NUMERIC;
  v_status TEXT;
BEGIN
  -- Get invoice total
  SELECT i.total INTO v_total
  FROM invoices i
  WHERE i.id = invoice_uuid AND i.deleted_at IS NULL;

  -- Get sum of payments
  SELECT COALESCE(SUM(p.amount), 0) INTO v_paid
  FROM payments p
  WHERE p.invoice_id = invoice_uuid AND p.deleted_at IS NULL;

  -- Calculate balance
  v_balance := v_total - v_paid;

  -- Determine status
  IF v_paid = 0 THEN
    v_status := 'unpaid';
  ELSIF v_paid >= v_total THEN
    v_status := 'paid';
  ELSE
    v_status := 'partial';
  END IF;

  RETURN QUERY SELECT v_total, v_paid, v_balance, v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
