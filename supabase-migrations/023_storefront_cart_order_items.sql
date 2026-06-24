-- Storefront cart: allow quantity updates + one row per product per draft order

CREATE POLICY "customers_update_own_order_items" ON public.order_items
  FOR UPDATE
  USING (
    order_id IN (
      SELECT o.id
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE c.auth_user_id = auth.uid()
        AND o.status = 'draft'
        AND o.source = 'storefront'
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT o.id
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE c.auth_user_id = auth.uid()
        AND o.status = 'draft'
        AND o.source = 'storefront'
    )
  );

-- Merge duplicate lines (same product on same draft order) before unique index
WITH ranked AS (
  SELECT
    id,
    order_id,
    product_id,
    quantity,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, product_id
      ORDER BY created_at ASC, id ASC
    ) AS rn,
    SUM(quantity) OVER (PARTITION BY order_id, product_id) AS total_qty
  FROM public.order_items
)
UPDATE public.order_items oi
SET quantity = ranked.total_qty
FROM ranked
WHERE oi.id = ranked.id
  AND ranked.rn = 1;

DELETE FROM public.order_items oi
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY order_id, product_id
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.order_items
  ) ranked
  WHERE ranked.rn > 1
) dupes
WHERE oi.id = dupes.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_order_product
  ON public.order_items(order_id, product_id);
