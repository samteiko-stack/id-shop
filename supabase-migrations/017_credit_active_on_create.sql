-- Credit notes are active as soon as they are created (no draft/issued workflow)
UPDATE credit_invoices SET status = 'applied' WHERE status IN ('draft', 'issued');

ALTER TABLE credit_invoices ALTER COLUMN status SET DEFAULT 'applied';
