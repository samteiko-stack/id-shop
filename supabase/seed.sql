-- ═══════════════════════════════════════════════════════════════
-- ID SHOP — SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- placeholder user UUID for created_by fields (replaced with real user after setup)
do $$ begin
  if not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000000') then
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
    values ('00000000-0000-0000-0000-000000000000', 'seed@idshop.internal', '', now(), now(), now(), '{"role":"admin"}');
  end if;
end $$;

-- ── Settings ──────────────────────────────────────────────────
insert into public.settings (key, value) values
  ('company_name',    '"ID Shop Lda"'),
  ('company_address', '"Rua das Clínicas 45, 1200-000 Lisboa"'),
  ('company_tax_id',  '"PT512345678"'),
  ('company_email',   '"geral@idshop.pt"'),
  ('company_phone',   '"+351 21 123 4567"'),
  ('invoice_prefix',  '"INV"'),
  ('credit_prefix',   '"CRD"'),
  ('order_prefix',    '"ORD"'),
  ('default_currency','"EUR"'),
  ('default_tax_rate','"25"')
on conflict (key) do update set value = excluded.value;

-- ── Categories ────────────────────────────────────────────────
insert into public.categories (id, name, slug) values
  ('4baaf811-f6c6-49a1-b1bd-aeb25bb7daa7', 'Dental',      'dental'),
  ('236e4b7b-e4ca-4db7-abc5-d05f983786f1', 'Medical',     'medical'),
  ('38e9c013-d459-4b29-9e6f-a451e71afceb', 'Surgical',    'surgical'),
  ('fc8d03a0-7302-4c47-bcf6-bc17bbcbb9e5', 'Diagnostics', 'diagnostics'),
  ('ba83df4d-4a21-406c-9a96-1a33cc44e29e', 'PPE',         'ppe')
on conflict (id) do nothing;

insert into public.categories (id, name, slug, parent_id) values
  ('f685d455-db26-4432-b67d-0c3f612ee9d1', 'Implants',             'dental-implants',    '4baaf811-f6c6-49a1-b1bd-aeb25bb7daa7'),
  ('b2ac17aa-30a6-4089-ba07-fb1e8c6b40b0', 'Composites',           'dental-composites',  '4baaf811-f6c6-49a1-b1bd-aeb25bb7daa7'),
  ('ee994003-9b6b-4d0f-8785-2cce8e28d273', 'Instruments',          'dental-instruments', '4baaf811-f6c6-49a1-b1bd-aeb25bb7daa7'),
  ('b1f54791-6e63-45b1-9c0f-5d9f7b55bf5b', 'Catheters',            'medical-catheters',  '236e4b7b-e4ca-4db7-abc5-d05f983786f1'),
  ('edd400f1-ee00-447f-bee4-f922a4cc74f6', 'Bandages & Dressings', 'bandages',           '236e4b7b-e4ca-4db7-abc5-d05f983786f1'),
  ('4525f0e5-a1ec-4013-963d-459b6fc26f18', 'Gloves',               'ppe-gloves',         'ba83df4d-4a21-406c-9a96-1a33cc44e29e')
on conflict (id) do nothing;

-- ── Products ──────────────────────────────────────────────────
insert into public.products (id, name, ref, description, category_id, unit_price, is_active) values
  ('dd5009cc-3ef1-4bea-a0f2-0dc6a4854239', 'BioHorizons Tapered Pro 3.5mm',     'BH-TP-35',   'Tapered dental implant, RBT surface, 3.5mm',               'f685d455-db26-4432-b67d-0c3f612ee9d1', 185.00, true),
  ('e76910c8-723f-47f5-9164-aba9094ecaf8', 'BioHorizons Tapered Pro 4.0mm',     'BH-TP-40',   'Tapered dental implant, RBT surface, 4.0mm',               'f685d455-db26-4432-b67d-0c3f612ee9d1', 185.00, true),
  ('5803dc2f-26b5-431b-bdeb-4646fff1bf80', 'Nobel Active 3.5 x 10mm',           'NB-AC-3510', 'Nobel Biocare Active implant, internal connection',         'f685d455-db26-4432-b67d-0c3f612ee9d1', 210.00, true),
  ('ef981444-206d-4dcd-a1ad-473bb7961213', 'Filtek Supreme A2 Body 4g',         'FK-SUA2B',   '3M Filtek Supreme Ultra nanofilled composite, A2 shade',   'b2ac17aa-30a6-4089-ba07-fb1e8c6b40b0',  22.50, true),
  ('9f7f6ce8-444c-4d7c-9964-c6a9a3892547', 'Tetric EvoCeram A1 3.5g',           'TEC-A1',     'Ivoclar Vivadent Tetric EvoCeram, A1 shade',               'b2ac17aa-30a6-4089-ba07-fb1e8c6b40b0',  19.80, true),
  ('a6804c42-7c54-4b75-af4a-ca4dbc1ce898', 'Gracey Curette 5/6',                'GC-56',      'Stainless steel periodontal curette, autoclavable',         'ee994003-9b6b-4d0f-8785-2cce8e28d273',  28.00, true),
  ('795c1ef8-a836-479d-bd53-24c5267c20eb', 'Foley Catheter 14Fr Silicone 10pk', 'FC-14S-10',  'Two-way Foley catheter, 100% silicone, 14Fr, box of 10',   'b1f54791-6e63-45b1-9c0f-5d9f7b55bf5b',  42.00, true),
  ('d5110aa7-1a09-4db3-acc8-8e9482bc062e', 'Mepore Adhesive Dressing 9x15cm',   'MP-915-50',  'Mölnlycke Mepore self-adhesive dressing, 9x15cm, x50',     'edd400f1-ee00-447f-bee4-f922a4cc74f6',  18.50, true),
  ('c7cde6ff-64f0-49dc-9454-458d9cb8a194', 'Nitrile Exam Gloves M Box/100',     'NG-M-100',   'Powder-free nitrile examination gloves, medium, x100',     '4525f0e5-a1ec-4013-963d-459b6fc26f18',  11.90, true),
  ('d623bf2c-20f0-4a4f-be1c-341565c8c2c2', 'Nitrile Exam Gloves L Box/100',     'NG-L-100',   'Powder-free nitrile examination gloves, large, x100',      '4525f0e5-a1ec-4013-963d-459b6fc26f18',  11.90, true)
on conflict (id) do nothing;

-- ── Customers ─────────────────────────────────────────────────
insert into public.customers (id, name, email, phone, address, tax_id, notes) values
  ('fd0e0431-202e-46c2-985f-67b145623674', 'Clínica Dental Sorriso',     'geral@clinicasorriso.pt',     '+351 21 456 7890', 'Av. da Liberdade 120, 1250-096 Lisboa',    'PT501234567', 'Dr. Ana Ferreira'),
  ('726cabe3-cb97-412b-a0f0-a322c8e23165', 'Centro Médico Saúde Total',  'compras@saudetotal.pt',       '+351 22 987 6543', 'Rua de Santa Catarina 88, 4000-442 Porto', 'PT502345678', 'Eng. João Mendes'),
  ('bd632751-2da9-43a8-b826-60acd142acb0', 'Hospital Particular do Sul', 'aprovisionamento@hps.pt',     '+351 28 312 3456', 'Estrada Nacional 125, 8000-503 Faro',      'PT503456789', 'Pagamento a 60 dias'),
  ('8cd00d51-d9f3-4d53-a4cd-8e9c13ac7c2d', 'Consultório Dr. Rodrigues',  'dr.rodrigues@gmail.com',      '+351 93 111 2233', 'Rua do Ouro 55, 1100-060 Lisboa',          'PT504567890', null),
  ('eb332eba-c5b3-4089-b1e9-8d54f9d576ae', 'Farmácia Central Braga',     'encomendas@farmaciabraga.pt', '+351 25 326 7890', 'Praça da República 14, 4700-320 Braga',    'PT505678901', 'PPE e pensos'),
  ('18368022-e62e-4b14-a834-83d6f92fe1f8', 'Clínica Ortopédica Norte',   'geral@ortonorte.pt',          '+351 22 543 2100', 'Rua Álvares Cabral 30, 4050-042 Porto',    'PT506789012', null)
on conflict (id) do nothing;

-- ── Sequence counters ─────────────────────────────────────────
insert into public.sequence_counters (id, year, last_value) values
  (uuid_generate_v4(), extract(year from now())::int, 12)
on conflict do nothing;

-- ── Orders ────────────────────────────────────────────────────
insert into public.orders (id, order_number, customer_id, status, notes, created_by, created_at) values
  ('91f382b9-79c6-455e-a455-2bb968790bb2', 'ORD-00001', 'fd0e0431-202e-46c2-985f-67b145623674', 'fulfilled', 'Urgente — nova sala',                          '00000000-0000-0000-0000-000000000000', now() - interval '45 days'),
  ('3c03097f-6fa9-4400-8b4b-2c1f93be17a3', 'ORD-00002', '726cabe3-cb97-412b-a0f0-a322c8e23165', 'fulfilled', null,                                           '00000000-0000-0000-0000-000000000000', now() - interval '38 days'),
  ('8ed7a8e8-7998-41f5-ae91-391b1ba470a0', 'ORD-00003', 'bd632751-2da9-43a8-b826-60acd142acb0', 'fulfilled', 'Entrega parcial autorizada',                   '00000000-0000-0000-0000-000000000000', now() - interval '30 days'),
  ('905f759e-660e-49e7-962e-2833d048b36c', 'ORD-00004', 'fd0e0431-202e-46c2-985f-67b145623674', 'confirmed', null,                                           '00000000-0000-0000-0000-000000000000', now() - interval '10 days'),
  ('80d37abe-1530-49d6-bf37-0bace3784e76', 'ORD-00005', '8cd00d51-d9f3-4d53-a4cd-8e9c13ac7c2d', 'confirmed', null,                                           '00000000-0000-0000-0000-000000000000', now() - interval '7 days'),
  ('a8531d27-1024-4264-8479-ad5d7f43ea3f', 'ORD-00006', 'eb332eba-c5b3-4089-b1e9-8d54f9d576ae', 'draft',     null,                                           '00000000-0000-0000-0000-000000000000', now() - interval '2 days'),
  ('c8112b59-6eb3-4141-b4ae-11db9c97d1dc', 'ORD-00007', '18368022-e62e-4b14-a834-83d6f92fe1f8', 'draft',     'A aguardar confirmação de stock',              '00000000-0000-0000-0000-000000000000', now() - interval '1 day'),
  ('1ba9a82a-9717-4558-afd5-3154f8e398f6', 'ORD-00008', 'bd632751-2da9-43a8-b826-60acd142acb0', 'cancelled', 'Cancelado por restrições orçamentais',          '00000000-0000-0000-0000-000000000000', now() - interval '20 days')
on conflict (id) do nothing;

-- ── Order items ───────────────────────────────────────────────
insert into public.order_items (id, order_id, product_id, quantity, unit_price) values
  ('98482cab-d77a-4bde-99cd-84d5da087519', '91f382b9-79c6-455e-a455-2bb968790bb2', 'dd5009cc-3ef1-4bea-a0f2-0dc6a4854239', 10, 185.00),
  ('4926eb68-272b-4680-84c6-c1218aa9aca3', '91f382b9-79c6-455e-a455-2bb968790bb2', 'e76910c8-723f-47f5-9164-aba9094ecaf8',  5, 185.00),
  ('614bbce4-e42c-450b-bf95-f422e8b0da35', '91f382b9-79c6-455e-a455-2bb968790bb2', 'ef981444-206d-4dcd-a1ad-473bb7961213', 20,  22.50),
  ('3b24e7da-c3d9-4ffd-8126-3d1573ec9d46', '3c03097f-6fa9-4400-8b4b-2c1f93be17a3', '795c1ef8-a836-479d-bd53-24c5267c20eb', 15,  42.00),
  ('14aa7880-7f01-4faf-a52d-1b25a471f8c4', '3c03097f-6fa9-4400-8b4b-2c1f93be17a3', 'c7cde6ff-64f0-49dc-9454-458d9cb8a194', 30,  11.90),
  ('ca9b9937-3e82-46e8-8c9f-e7b7f479ace9', '8ed7a8e8-7998-41f5-ae91-391b1ba470a0', 'd5110aa7-1a09-4db3-acc8-8e9482bc062e', 50,  18.50),
  ('8322a736-d658-4a62-a4f4-bacee50192dd', '8ed7a8e8-7998-41f5-ae91-391b1ba470a0', 'd623bf2c-20f0-4a4f-be1c-341565c8c2c2', 40,  11.90),
  ('02e7dc4e-6cd4-46d8-bd02-26f07e7a4909', '8ed7a8e8-7998-41f5-ae91-391b1ba470a0', '795c1ef8-a836-479d-bd53-24c5267c20eb',  8,  42.00),
  ('293539f9-7187-4427-a1cb-4df263717520', '905f759e-660e-49e7-962e-2833d048b36c', '5803dc2f-26b5-431b-bdeb-4646fff1bf80',  6, 210.00),
  ('27a90f69-2611-4dec-bf15-8d664d005d95', '905f759e-660e-49e7-962e-2833d048b36c', '9f7f6ce8-444c-4d7c-9964-c6a9a3892547', 12,  19.80),
  ('b7aa75d8-6d34-4f00-bb7d-e465d8a0f17d', '80d37abe-1530-49d6-bf37-0bace3784e76', 'a6804c42-7c54-4b75-af4a-ca4dbc1ce898',  4,  28.00),
  ('4f9e38d9-78bd-4fb9-9999-59d116f28c95', '80d37abe-1530-49d6-bf37-0bace3784e76', 'ef981444-206d-4dcd-a1ad-473bb7961213',  8,  22.50),
  ('fbcbfca6-67cc-4e0a-82e1-4276907649e5', 'a8531d27-1024-4264-8479-ad5d7f43ea3f', 'c7cde6ff-64f0-49dc-9454-458d9cb8a194', 20,  11.90),
  ('4dd971f9-26cc-46bf-9f31-70ccc0e73bb7', 'a8531d27-1024-4264-8479-ad5d7f43ea3f', 'd623bf2c-20f0-4a4f-be1c-341565c8c2c2', 20,  11.90),
  ('46bf53b6-d852-409f-bfc2-ed9f5abda7fa', 'a8531d27-1024-4264-8479-ad5d7f43ea3f', 'd5110aa7-1a09-4db3-acc8-8e9482bc062e', 30,  18.50),
  ('fdfb4902-1bfc-4e7a-b7c5-611c849db3e6', 'c8112b59-6eb3-4141-b4ae-11db9c97d1dc', '795c1ef8-a836-479d-bd53-24c5267c20eb', 12,  42.00)
on conflict (id) do nothing;

-- ── Product batches ───────────────────────────────────────────
insert into public.product_batches (id, product_id, ref, lot_number, expiry_date, raw_qr_payload, scanned_at, scanned_by) values
  ('c872e0a6-e1f6-462c-9119-2aea04a97d49', 'dd5009cc-3ef1-4bea-a0f2-0dc6a4854239', 'REF-BH-TP35-001', 'LOT2024A001', '2027-06-30', 'REF:REF-BH-TP35-001|LOT:LOT2024A001|EXP:2027-06-30', now() - interval '60 days',  '00000000-0000-0000-0000-000000000000'),
  ('f5e27cb4-c3c7-4cd2-87e3-59953f5313d3', 'e76910c8-723f-47f5-9164-aba9094ecaf8', 'REF-BH-TP40-001', 'LOT2024A002', '2027-06-30', 'REF:REF-BH-TP40-001|LOT:LOT2024A002|EXP:2027-06-30', now() - interval '60 days',  '00000000-0000-0000-0000-000000000000'),
  ('dc0000ff-603c-4998-8456-11544e98582e', '5803dc2f-26b5-431b-bdeb-4646fff1bf80', 'REF-NB-AC35-001', 'LOT2024B001', '2026-12-31', 'REF:REF-NB-AC35-001|LOT:LOT2024B001|EXP:2026-12-31', now() - interval '45 days',  '00000000-0000-0000-0000-000000000000'),
  ('f007704e-cc69-44ed-8f2e-0aa0752ecc59', 'ef981444-206d-4dcd-a1ad-473bb7961213', 'REF-FK-A2B-001',  'LOT2024C001', '2026-08-31', 'REF:REF-FK-A2B-001|LOT:LOT2024C001|EXP:2026-08-31',  now() - interval '30 days',  '00000000-0000-0000-0000-000000000000'),
  ('b364a470-dcc3-4e84-8167-fdb409892bca', '9f7f6ce8-444c-4d7c-9964-c6a9a3892547', 'REF-TEC-A1-001',  'LOT2024C002', '2026-07-15', 'REF:REF-TEC-A1-001|LOT:LOT2024C002|EXP:2026-07-15',  now() - interval '30 days',  '00000000-0000-0000-0000-000000000000'),
  ('71458974-012b-4784-acbf-fd532971775d', '795c1ef8-a836-479d-bd53-24c5267c20eb', 'REF-FC14S-001',   'LOT2024D001', '2028-03-31', 'REF:REF-FC14S-001|LOT:LOT2024D001|EXP:2028-03-31',   now() - interval '20 days',  '00000000-0000-0000-0000-000000000000'),
  ('6ab243f7-8e16-44fb-88b1-2485d6f76a92', 'd5110aa7-1a09-4db3-acc8-8e9482bc062e', 'REF-MP915-001',   'LOT2024E001', '2027-09-30', 'REF:REF-MP915-001|LOT:LOT2024E001|EXP:2027-09-30',   now() - interval '15 days',  '00000000-0000-0000-0000-000000000000'),
  ('caa89149-5b39-4074-b599-c0a4f282bb61', 'c7cde6ff-64f0-49dc-9454-458d9cb8a194', 'REF-NGM-001',     'LOT2024F001', '2026-09-30', 'REF:REF-NGM-001|LOT:LOT2024F001|EXP:2026-09-30',     now() - interval '10 days',  '00000000-0000-0000-0000-000000000000'),
  ('038ac445-6903-4080-a038-0073dfdc645d', 'd623bf2c-20f0-4a4f-be1c-341565c8c2c2', 'REF-NGL-001',     'LOT2024F002', '2026-09-30', 'REF:REF-NGL-001|LOT:LOT2024F002|EXP:2026-09-30',     now() - interval '10 days',  '00000000-0000-0000-0000-000000000000'),
  ('c872e0a6-e1f6-462c-9119-2aea04a97d4a', 'ef981444-206d-4dcd-a1ad-473bb7961213', 'REF-FK-A2B-002',  'LOT2023Z001', '2026-07-01', 'REF:REF-FK-A2B-002|LOT:LOT2023Z001|EXP:2026-07-01',  now() - interval '180 days', '00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

-- ── Order item batches (traceability) ─────────────────────────
insert into public.order_item_batches (order_item_id, batch_id, quantity) values
  ('98482cab-d77a-4bde-99cd-84d5da087519', 'c872e0a6-e1f6-462c-9119-2aea04a97d49', 10),
  ('4926eb68-272b-4680-84c6-c1218aa9aca3', 'f5e27cb4-c3c7-4cd2-87e3-59953f5313d3',  5),
  ('614bbce4-e42c-450b-bf95-f422e8b0da35', 'f007704e-cc69-44ed-8f2e-0aa0752ecc59', 20),
  ('3b24e7da-c3d9-4ffd-8126-3d1573ec9d46', '71458974-012b-4784-acbf-fd532971775d', 15),
  ('14aa7880-7f01-4faf-a52d-1b25a471f8c4', 'caa89149-5b39-4074-b599-c0a4f282bb61', 30),
  ('ca9b9937-3e82-46e8-8c9f-e7b7f479ace9', '6ab243f7-8e16-44fb-88b1-2485d6f76a92', 50),
  ('8322a736-d658-4a62-a4f4-bacee50192dd', '038ac445-6903-4080-a038-0073dfdc645d', 40),
  ('02e7dc4e-6cd4-46d8-bd02-26f07e7a4909', '71458974-012b-4784-acbf-fd532971775d',  8)
on conflict do nothing;

-- ── Invoices ──────────────────────────────────────────────────
insert into public.invoices (id, invoice_number, customer_id, order_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, currency, created_by, created_at) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'INV-00001', 'fd0e0431-202e-46c2-985f-67b145623674', '91f382b9-79c6-455e-a455-2bb968790bb2', 'paid',   current_date - 44, current_date - 14, 3225.00, 25, 806.25, 4031.25, 'EUR', '00000000-0000-0000-0000-000000000000', now() - interval '44 days'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'INV-00002', '726cabe3-cb97-412b-a0f0-a322c8e23165', '3c03097f-6fa9-4400-8b4b-2c1f93be17a3', 'paid',   current_date - 37, current_date - 7,  987.00,  25, 246.75, 1233.75,'EUR', '00000000-0000-0000-0000-000000000000', now() - interval '37 days'),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'INV-00003', 'bd632751-2da9-43a8-b826-60acd142acb0', '8ed7a8e8-7998-41f5-ae91-391b1ba470a0', 'issued', current_date - 29, current_date + 31, 1737.00, 25, 434.25, 2171.25,'EUR', '00000000-0000-0000-0000-000000000000', now() - interval '29 days'),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'INV-00004', 'fd0e0431-202e-46c2-985f-67b145623674', null,                                   'draft',  null,              null,              0,       25, 0,      0,      'EUR', '00000000-0000-0000-0000-000000000000', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.invoice_items (invoice_id, description, quantity, unit_price, line_total) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'BioHorizons Tapered Pro 3.5mm', 10, 185.00, 1850.00),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'BioHorizons Tapered Pro 4.0mm',  5, 185.00,  925.00),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Filtek Supreme A2 Body 4g',     20,  22.50,  450.00),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Foley Catheter 14Fr Silicone',  15,  42.00,  630.00),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Nitrile Exam Gloves M x30',     30,  11.90,  357.00),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Mepore Adhesive Dressing x50',  50,  18.50,  925.00),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Nitrile Exam Gloves L x40',     40,  11.90,  476.00),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Foley Catheter 14Fr Silicone',   8,  42.00,  336.00)
on conflict do nothing;

-- ── Credit invoice ────────────────────────────────────────────
insert into public.credit_invoices (id, credit_number, invoice_id, customer_id, status, reason, subtotal, tax_amount, total, created_by, created_at) values
  ('a1b2c3d4-0001-0001-0001-000000000005', 'CRD-00001', 'a1b2c3d4-0001-0001-0001-000000000001', 'fd0e0431-202e-46c2-985f-67b145623674', 'applied', 'Devolução de 1 implante danificado', 185.00, 42.55, 227.55, '00000000-0000-0000-0000-000000000000', now() - interval '20 days')
on conflict (id) do nothing;

insert into public.credit_invoice_items (credit_invoice_id, description, quantity, unit_price, line_total) values
  ('a1b2c3d4-0001-0001-0001-000000000005', 'BioHorizons Tapered Pro 3.5mm — devolução', 1, 185.00, 185.00)
on conflict do nothing;
