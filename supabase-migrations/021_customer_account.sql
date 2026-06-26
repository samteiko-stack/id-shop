-- Customer account: self-service profile updates + scoped read access

-- Customers can update their own company/contact details (not notes, discount group, approval)
CREATE POLICY "customers_update_own_record" ON public.customers
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Customers can read payments on their own invoices (for payment status in account)
CREATE POLICY "customers_select_own_payments" ON public.payments
  FOR SELECT
  USING (
    public.current_user_role() = 'customer'
    AND invoice_id IN (
      SELECT i.id
      FROM public.invoices i
      JOIN public.customers c ON c.id = i.customer_id
      WHERE c.auth_user_id = auth.uid()
        AND i.deleted_at IS NULL
    )
  );

-- Customers can read credit notes linked to their invoices
CREATE POLICY "customers_select_own_credit_invoices" ON public.credit_invoices
  FOR SELECT
  USING (
    public.current_user_role() = 'customer'
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "customers_select_own_credit_invoice_items" ON public.credit_invoice_items
  FOR SELECT
  USING (
    public.current_user_role() = 'customer'
    AND credit_invoice_id IN (
      SELECT ci.id
      FROM public.credit_invoices ci
      JOIN public.customers c ON c.id = ci.customer_id
      WHERE c.auth_user_id = auth.uid()
    )
  );
