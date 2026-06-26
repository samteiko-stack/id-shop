-- Linked invoices should use the same reference number as their sale.
UPDATE public.invoices i
SET
  invoice_number = o.order_number,
  pdf_url = NULL,
  updated_at = now()
FROM public.orders o
WHERE i.order_id = o.id
  AND i.deleted_at IS NULL
  AND o.deleted_at IS NULL
  AND i.invoice_number IS DISTINCT FROM o.order_number
  AND NOT EXISTS (
    SELECT 1
    FROM public.invoices other
    WHERE other.invoice_number = o.order_number
      AND other.id <> i.id
      AND other.deleted_at IS NULL
  );
