-- Align default VAT (moms) with Swedish standard rate (25%)
-- Existing invoices keep their stored tax_rate; this updates defaults only.

UPDATE public.settings
SET value = '"25"', updated_at = now()
WHERE key = 'default_tax_rate'
  AND value::text IN ('"23"', '23');

UPDATE public.settings
SET
  value = jsonb_set(value, '{default_tax_rate}', '25'::jsonb, true),
  updated_at = now()
WHERE key = 'invoice'
  AND (value->>'default_tax_rate')::numeric = 23;
