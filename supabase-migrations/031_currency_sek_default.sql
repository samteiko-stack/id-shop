-- Swedish company: default currency SEK (was EUR from early setup)

ALTER TABLE public.products
  ALTER COLUMN currency SET DEFAULT 'SEK';

ALTER TABLE public.invoices
  ALTER COLUMN currency SET DEFAULT 'SEK';

UPDATE public.products SET currency = 'SEK' WHERE currency = 'EUR';
UPDATE public.invoices SET currency = 'SEK' WHERE currency = 'EUR';
