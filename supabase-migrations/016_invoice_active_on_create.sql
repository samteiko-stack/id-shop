-- Invoices are active as soon as they are created (no draft step)
UPDATE invoices SET status = 'issued' WHERE status = 'draft';
