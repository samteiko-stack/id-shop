-- ============================================================
-- SEED: Categories & Products matching legacy site structure
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  -- Top level
  id_implants   UUID;
  id_dental     UUID;

  -- Implants L2
  id_jdev_s32     UUID;
  id_jdev_plus    UUID;
  id_jdicon_ultra UUID;

  -- Implants L3 (JDEVOLUTION S 3.2 components)
  id_impl32   UUID;
  id_cover32  UUID;
  id_heal32   UUID;

  -- Dental L2
  id_biomaterial UUID;

  -- Dental L3
  id_bio_sarvard UUID;

BEGIN

  -- ── Level 1 ────────────────────────────────────────────────
  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Implants', 'implants', NULL, 'list')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO id_implants;

  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Dental', 'dental', NULL, 'list')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO id_dental;

  -- ── Implants L2 ────────────────────────────────────────────
  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('JDEVOLUTION S 3.2', 'jdevolution-s-32', id_implants, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_jdev_s32;

  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('JDEVOLUTION PLUS', 'jdevolution-plus', id_implants, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_jdev_plus;

  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('JDICON ULTRA S 2.75', 'jdicon-ultra-s-275', id_implants, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_jdicon_ultra;

  -- ── JDEVOLUTION S 3.2 L3 ───────────────────────────────────
  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Implants 3.2', 'implants-32', id_jdev_s32, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_impl32;

  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Cover Screws', 'cover-screws-32', id_jdev_s32, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_cover32;

  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Healing Abutments', 'healing-abutments-32', id_jdev_s32, 'list')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_heal32;

  -- ── Dental L2 ──────────────────────────────────────────────
  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Biomaterial & Sutures', 'biomaterial-sutures', id_dental, 'grouped')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_biomaterial;

  -- ── Dental L3 ──────────────────────────────────────────────
  INSERT INTO categories (name, slug, parent_id, display_style)
    VALUES ('Biomaterial Sarvard', 'biomaterial-sarvard', id_biomaterial, 'grouped')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id INTO id_bio_sarvard;

  -- ── Products: JDEVOLUTION S 3.2 Implants (15 products) ─────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, display_order)
  VALUES
    ('JDEvolution®S Ø 3.2 L 6',    'EV32060', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 5),
    ('JDEvolution®S Ø 3.2 L 8',    'EV32080', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 10),
    ('JDEvolution®S Ø 3.2 L 10',   'EV32100', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 20),
    ('JDEvolution®S Ø 3.2 L 11.5', 'EV32115', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 30),
    ('JDEvolution®S Ø 3.2 L 13',   'EV32130', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 40),
    ('JDEvolution®S Ø 3.2 L 15',   'EV32150', 'J Dental Care', id_impl32, 1800.00, 'SEK', 'st', true, 50),
    ('JDEvolution®S Ø 3.5 L 6',    'EV35060', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 60),
    ('JDEvolution®S Ø 3.5 L 8',    'EV35080', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 70),
    ('JDEvolution®S Ø 3.5 L 10',   'EV35100', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 80),
    ('JDEvolution®S Ø 3.5 L 11.5', 'EV35115', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 90),
    ('JDEvolution®S Ø 3.5 L 13',   'EV35130', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 100),
    ('JDEvolution®S Ø 3.5 L 15',   'EV35150', 'J Dental Care', id_impl32, 1900.00, 'SEK', 'st', true, 110),
    ('JDEvolution®S Ø 4.0 L 8',    'EV40080', 'J Dental Care', id_impl32, 2000.00, 'SEK', 'st', true, 120),
    ('JDEvolution®S Ø 4.0 L 10',   'EV40100', 'J Dental Care', id_impl32, 2000.00, 'SEK', 'st', true, 130),
    ('JDEvolution®S Ø 4.0 L 11.5', 'EV40115', 'J Dental Care', id_impl32, 2000.00, 'SEK', 'st', true, 140),
    ('JDEvolution®S Ø 4.0 L 13',   'EV40130', 'J Dental Care', id_impl32, 2000.00, 'SEK', 'st', true, 150),
    ('JDEvolution®S Ø 4.0 L 15',   'EV40150', 'J Dental Care', id_impl32, 2000.00, 'SEK', 'st', true, 160),
    ('JDEvolution®S Ø 4.5 L 8',    'EV45080', 'J Dental Care', id_impl32, 2100.00, 'SEK', 'st', true, 170),
    ('JDEvolution®S Ø 4.5 L 10',   'EV45100', 'J Dental Care', id_impl32, 2100.00, 'SEK', 'st', true, 180),
    ('JDEvolution®S Ø 4.5 L 11.5', 'EV45115', 'J Dental Care', id_impl32, 2100.00, 'SEK', 'st', true, 190),
    ('JDEvolution®S Ø 4.5 L 13',   'EV45130', 'J Dental Care', id_impl32, 2100.00, 'SEK', 'st', true, 200),
    ('JDEvolution®S Ø 4.5 L 15',   'EV45150', 'J Dental Care', id_impl32, 2100.00, 'SEK', 'st', true, 210),
    ('JDEvolution®S Ø 5.0 L 8',    'EV50080', 'J Dental Care', id_impl32, 2200.00, 'SEK', 'st', true, 220),
    ('JDEvolution®S Ø 5.0 L 10',   'EV50100', 'J Dental Care', id_impl32, 2200.00, 'SEK', 'st', true, 230),
    ('JDEvolution®S Ø 5.0 L 13',   'EV50130', 'J Dental Care', id_impl32, 2200.00, 'SEK', 'st', true, 240);

  -- ── Products: Cover Screws ──────────────────────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, display_order)
  VALUES
    ('Cover Screw Ø 3.2 H 1.0', 'CS32010', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 10),
    ('Cover Screw Ø 3.2 H 1.5', 'CS32015', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 20),
    ('Cover Screw Ø 3.2 H 2.0', 'CS32020', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 30),
    ('Cover Screw Ø 3.5 H 1.0', 'CS35010', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 40),
    ('Cover Screw Ø 3.5 H 1.5', 'CS35015', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 50),
    ('Cover Screw Ø 3.5 H 2.0', 'CS35020', 'J Dental Care', id_cover32, 350.00, 'SEK', 'st', true, 60),
    ('Cover Screw Ø 4.0 H 1.0', 'CS40010', 'J Dental Care', id_cover32, 380.00, 'SEK', 'st', true, 70),
    ('Cover Screw Ø 4.0 H 1.5', 'CS40015', 'J Dental Care', id_cover32, 380.00, 'SEK', 'st', true, 80),
    ('Cover Screw Ø 4.5 H 1.0', 'CS45010', 'J Dental Care', id_cover32, 380.00, 'SEK', 'st', true, 90),
    ('Cover Screw Ø 4.5 H 1.5', 'CS45015', 'J Dental Care', id_cover32, 380.00, 'SEK', 'st', true, 100);

  -- ── Products: Healing Abutments ────────────────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, display_order)
  VALUES
    ('Healing Abutment Ø 3.2 H 3', 'HA32030', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 10),
    ('Healing Abutment Ø 3.2 H 5', 'HA32050', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 20),
    ('Healing Abutment Ø 3.2 H 7', 'HA32070', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 30),
    ('Healing Abutment Ø 3.5 H 3', 'HA35030', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 40),
    ('Healing Abutment Ø 3.5 H 5', 'HA35050', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 50),
    ('Healing Abutment Ø 3.5 H 7', 'HA35070', 'J Dental Care', id_heal32, 420.00, 'SEK', 'st', true, 60),
    ('Healing Abutment Ø 4.0 H 3', 'HA40030', 'J Dental Care', id_heal32, 450.00, 'SEK', 'st', true, 70),
    ('Healing Abutment Ø 4.0 H 5', 'HA40050', 'J Dental Care', id_heal32, 450.00, 'SEK', 'st', true, 80),
    ('Healing Abutment Ø 4.5 H 3', 'HA45030', 'J Dental Care', id_heal32, 450.00, 'SEK', 'st', true, 90),
    ('Healing Abutment Ø 4.5 H 5', 'HA45050', 'J Dental Care', id_heal32, 450.00, 'SEK', 'st', true, 100);

  -- ── Products: RC Collagen (grouped) ────────────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, product_family, display_order)
  VALUES
    ('RCT Collagen Tape, 2.5x7.5cm, 1mm', '831456', 'ACE', id_bio_sarvard, 1775.00, 'SEK', '10 st', true, 'RC Collagen', 10),
    ('RCF Kollagen Skum, 2x4cm, 3mm',      '831462', 'ACE', id_bio_sarvard, 1475.00, 'SEK', '10 st', true, 'RC Collagen', 20),
    ('RCP Kollagen Plugg, 1x2cm',          '831466', 'ACE', id_bio_sarvard, 1363.00, 'SEK', '10 st', true, 'RC Collagen', 30);

  -- ── Products: ConForm Membran (grouped) ────────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, product_family, display_order)
  VALUES
    ('ConForm Membran, 15x20mm', '831461', 'ACE', id_bio_sarvard, 1124.00, 'SEK', 'st', true, 'ConForm Membran', 10),
    ('ConForm Membran, 20x30mm', '831463', 'ACE', id_bio_sarvard, 1400.00, 'SEK', 'st', true, 'ConForm Membran', 20),
    ('ConForm Membran, 30x40mm', '831465', 'ACE', id_bio_sarvard, 2126.00, 'SEK', 'st', true, 'ConForm Membran', 30);

  -- ── Products: Bio-Oss Bone (grouped) ───────────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, product_family, display_order)
  VALUES
    ('Bio-Oss Bone, 0.25g',  'BO0025', 'Geistlich', id_bio_sarvard, 890.00,  'SEK', 'st', true, 'Bio-Oss', 10),
    ('Bio-Oss Bone, 0.5g',   'BO0050', 'Geistlich', id_bio_sarvard, 1250.00, 'SEK', 'st', true, 'Bio-Oss', 20),
    ('Bio-Oss Bone, 1.0g',   'BO0100', 'Geistlich', id_bio_sarvard, 1890.00, 'SEK', 'st', true, 'Bio-Oss', 30),
    ('Bio-Oss Bone, 2.0g',   'BO0200', 'Geistlich', id_bio_sarvard, 3200.00, 'SEK', 'st', true, 'Bio-Oss', 40);

  -- ── Products: Bio-Gide Membrane (grouped) ──────────────────
  INSERT INTO products (name, ref, brand, category_id, unit_price, currency, unit, is_active, product_family, display_order)
  VALUES
    ('Bio-Gide Membran, 13x25mm', 'BG1325', 'Geistlich', id_bio_sarvard, 1650.00, 'SEK', 'st', true, 'Bio-Gide', 10),
    ('Bio-Gide Membran, 25x25mm', 'BG2525', 'Geistlich', id_bio_sarvard, 2450.00, 'SEK', 'st', true, 'Bio-Gide', 20),
    ('Bio-Gide Membran, 30x40mm', 'BG3040', 'Geistlich', id_bio_sarvard, 3800.00, 'SEK', 'st', true, 'Bio-Gide', 30);

END $$;
