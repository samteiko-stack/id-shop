-- ============================================================
-- Demo seed — 100 products across realistic dental/medical
-- categories, sub-categories, and families.
-- Clears all existing catalog data first, then inserts fresh.
-- ============================================================

-- ── 0. CLEAR EXISTING CATALOG DATA ───────────────────────────
-- Full FK chain: deepest dependents first
DELETE FROM order_item_batches;
DELETE FROM product_batches;
DELETE FROM order_items;
DELETE FROM invoice_items;
DELETE FROM products;
DELETE FROM product_families;
DELETE FROM categories;

-- ── 1. TOP-LEVEL CATEGORIES ───────────────────────────────────
INSERT INTO categories (name, slug, display_style)
VALUES
  ('Implants', 'implants', 'grouped'),
  ('Dental',   'dental',   'grouped'),
  ('Medical',  'medical',  'list'),
  ('PPE',      'ppe',      'list')
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  display_style = EXCLUDED.display_style;

-- ── 2. SUB-CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (name, slug, parent_id, display_style)
SELECT v.name, v.slug, c.id, v.style
FROM (VALUES
  ('JDEvolution S 3.2',    'jdevolution-s-32',   'implants', 'grouped'),
  ('JDEvolution S 5.3',    'jdevolution-s-53',   'implants', 'grouped'),
  ('JDEvolution Plus',     'jdevolution-plus',   'implants', 'grouped'),
  ('JD Surgical Kits',     'jd-surgical-kits',   'implants', 'list'),
  ('Biomaterial & Suturer','biomaterial-suturer', 'dental',   'grouped'),
  ('Composites & Bonding', 'composites-bonding',  'dental',   'grouped'),
  ('Endodontics',          'endodontics',         'dental',   'grouped'),
  ('Prosthodontics',       'prosthodontics',      'dental',   'grouped'),
  ('Diagnostics',          'diagnostics',         'medical',  'grouped'),
  ('Bandages & Dressings', 'bandages-dressings',  'medical',  'grouped'),
  ('Gloves',               'gloves',              'ppe',      'grouped'),
  ('Masks & Protection',   'masks-protection',    'ppe',      'grouped'),
  ('Surgical Apparel',     'surgical-apparel',    'ppe',      'grouped')
) AS v(name, slug, parent_slug, style)
JOIN categories c ON c.slug = v.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  display_style = EXCLUDED.display_style,
  parent_id     = EXCLUDED.parent_id;

-- ── 3. FAMILIES ───────────────────────────────────────────────
INSERT INTO product_families (name, category_id, display_order)
SELECT v.name, c.id, v.ord
FROM (VALUES
  ('Healing Abutments S 3.2',  'jdevolution-s-32',   1),
  ('Impression Coping S 3.2',  'jdevolution-s-32',   2),
  ('Fixture S 3.2',            'jdevolution-s-32',   3),
  ('Healing Abutments S 5.3',  'jdevolution-s-53',   1),
  ('Impression Coping S 5.3',  'jdevolution-s-53',   2),
  ('Drivers S 5.3',            'jdevolution-s-53',   3),
  ('Abutments S 5.3',          'jdevolution-s-53',   4),
  ('GinVal',                   'jdevolution-plus',   1),
  ('JDEvolution Starter Kit',  'jdevolution-plus',   2),
  ('JD Surgical Kits',         'jd-surgical-kits',   1),
  ('ConForm Membran',          'biomaterial-suturer',1),
  ('NuOss Granules',           'biomaterial-suturer',2),
  ('RC Collagen',              'biomaterial-suturer',3),
  ('Bio-Gide',                 'biomaterial-suturer',4),
  ('Tetric EvoFlow',           'composites-bonding', 1),
  ('OptiBond Universal',       'composites-bonding', 2),
  ('ProTaper Gold',            'endodontics',        1),
  ('M-Two Files',              'endodontics',        2),
  ('Temp-Bond',                'prosthodontics',     1),
  ('RelyX Cement',             'prosthodontics',     2),
  ('Caries Detector',          'diagnostics',        1),
  ('Steri-Strip',              'bandages-dressings', 1),
  ('Sterile Gauze',            'bandages-dressings', 2),
  ('Nitrile Exam Gloves',      'gloves',             1),
  ('Latex Surgical Gloves',    'gloves',             2),
  ('FFP2 Respirator',          'masks-protection',   1),
  ('Surgical Face Mask',       'masks-protection',   2),
  ('Surgical Gown',            'surgical-apparel',   1),
  ('Surgical Cap',             'surgical-apparel',   2)
) AS v(name, cat_slug, ord)
JOIN categories c ON c.slug = v.cat_slug
ON CONFLICT (name, category_id) DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- ── 4. PRODUCTS (100 total) ───────────────────────────────────
-- Columns: ref, name, brand, secondary_name, unit_price, cost_price, unit, alert_qty, cat_slug, family_name
INSERT INTO products (ref, name, brand, secondary_name, category_id, family_id, unit_price, cost_price, unit, alert_quantity, is_active, currency)
SELECT
  v.ref, v.name, v.brand, v.sec,
  c.id, pf.id,
  v.uprice::numeric, v.cprice::numeric,
  v.unit, v.alert::int,
  true, 'SEK'
FROM (VALUES
  -- JDE S3.2 — Healing Abutments
  ('HA-3230','Healing Abutment Ø 3.2×3.0','J Dental Care','JDEvolution S 3.2','500','120','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3235','Healing Abutment Ø 3.2×3.5','J Dental Care','JDEvolution S 3.2','500','120','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3240','Healing Abutment Ø 3.2×4.0','J Dental Care','JDEvolution S 3.2','500','120','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3250','Healing Abutment Ø 3.2×5.0','J Dental Care','JDEvolution S 3.2','500','120','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3260','Healing Abutment Ø 3.2×6.0','J Dental Care','JDEvolution S 3.2','520','130','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3270','Healing Abutment Ø 3.2×7.0','J Dental Care','JDEvolution S 3.2','520','130','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-3280','Healing Abutment Ø 3.2×8.0','J Dental Care','JDEvolution S 3.2','540','140','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  ('HA-32H', 'Healing Abutment Ø 3.2 Wide','J Dental Care','JDEvolution S 3.2','560','145','PC','5','jdevolution-s-32','Healing Abutments S 3.2'),
  -- JDE S3.2 — Impression Copings
  ('IC-32CT','Impression Coping Closed Tray S 3.2',    'J Dental Care','JDEvolution S 3.2','420','100','PC','5','jdevolution-s-32','Impression Coping S 3.2'),
  ('IC-32OT','Impression Coping Open Tray S 3.2',      'J Dental Care','JDEvolution S 3.2','420','100','PC','5','jdevolution-s-32','Impression Coping S 3.2'),
  ('IC-32DT','Impression Coping Direct Transfer S 3.2','J Dental Care','JDEvolution S 3.2','450','110','PC','5','jdevolution-s-32','Impression Coping S 3.2'),
  ('IC-32AN','Impression Coping Analog S 3.2',         'J Dental Care','JDEvolution S 3.2','380','90', 'PC','5','jdevolution-s-32','Impression Coping S 3.2'),
  -- JDE S3.2 — Fixtures
  ('FIX-3208','Fixture Ø 3.2×8mm S 3.2', 'J Dental Care','JDEvolution S 3.2','1800','600','PC','3','jdevolution-s-32','Fixture S 3.2'),
  ('FIX-3210','Fixture Ø 3.2×10mm S 3.2','J Dental Care','JDEvolution S 3.2','1800','600','PC','3','jdevolution-s-32','Fixture S 3.2'),
  ('FIX-3212','Fixture Ø 3.2×12mm S 3.2','J Dental Care','JDEvolution S 3.2','1900','620','PC','3','jdevolution-s-32','Fixture S 3.2'),
  ('FIX-3214','Fixture Ø 3.2×14mm S 3.2','J Dental Care','JDEvolution S 3.2','1900','620','PC','3','jdevolution-s-32','Fixture S 3.2'),
  -- JDE S5.3 — Healing Abutments
  ('HA-5330','Healing Abutment Ø 4.3×3.0','J Dental Care','JDEvolution S 5.3','550','130','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  ('HA-5340','Healing Abutment Ø 4.3×4.0','J Dental Care','JDEvolution S 5.3','550','130','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  ('HA-5350','Healing Abutment Ø 4.3×5.0','J Dental Care','JDEvolution S 5.3','550','130','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  ('HA-5360','Healing Abutment Ø 4.3×6.0','J Dental Care','JDEvolution S 5.3','570','140','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  ('HA-5370','Healing Abutment Ø 4.3×7.0','J Dental Care','JDEvolution S 5.3','570','140','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  ('HA-53GP','GP Abutment Ø 4.0 S 5.3',   'J Dental Care','JDEvolution S 5.3','600','130','PC','5','jdevolution-s-53','Healing Abutments S 5.3'),
  -- JDE S5.3 — Drivers
  ('DRV-53S', 'Driver Short S 5.3',    'J Dental Care','JDEvolution S 5.3','475','120','PC','3','jdevolution-s-53','Drivers S 5.3'),
  ('DRV-53L', 'Driver Long S 5.3',     'J Dental Care','JDEvolution S 5.3','475','120','PC','3','jdevolution-s-53','Drivers S 5.3'),
  ('DRV-53TQ','Torque Driver S 5.3',   'J Dental Care','JDEvolution S 5.3','650','200','PC','3','jdevolution-s-53','Drivers S 5.3'),
  -- JDE S5.3 — Abutments
  ('AB-53ST','Straight Abutment 1.5mm S 5.3','J Dental Care','JDEvolution S 5.3','750','250','PC','3','jdevolution-s-53','Abutments S 5.3'),
  ('AB-53AN','Angled Abutment 17° S 5.3',    'J Dental Care','JDEvolution S 5.3','850','280','PC','3','jdevolution-s-53','Abutments S 5.3'),
  ('AB-53TM','Temporary Abutment S 5.3',      'J Dental Care','JDEvolution S 5.3','620','160','PC','3','jdevolution-s-53','Abutments S 5.3'),
  ('AB-53SC','Abutment Screw S 5.3',          'J Dental Care','JDEvolution S 5.3','275','41', 'PC','10','jdevolution-s-53','Abutments S 5.3'),
  ('AB-53WB','Pre-Wired Blank S 5.3',         'J Dental Care','JDEvolution S 5.3','580','185','PC','3','jdevolution-s-53','Abutments S 5.3'),
  -- JDE Plus
  ('GV-11064','GinVal Anesthesia Kit',        'J Dental Care',NULL,'14750','11000','PC', '2','jdevolution-plus','GinVal'),
  ('JDE-SK1', 'JDEvolution Starter Kit 3.2',  'J Dental Care',NULL,'8500', '5200', 'KIT','2','jdevolution-plus','JDEvolution Starter Kit'),
  ('JDE-SK2', 'JDEvolution Starter Kit 5.3',  'J Dental Care',NULL,'9200', '5800', 'KIT','2','jdevolution-plus','JDEvolution Starter Kit'),
  -- Surgical Kits
  ('1906-14','JDZymos Retractor',                         'J Dental Care',NULL,'2000', '1000','PC', '2','jd-surgical-kits','JD Surgical Kits'),
  ('BD301',  'Sterile Set for Sublaminar Implantology',    'Hervis Schein',NULL,'11088','7000','SET','1','jd-surgical-kits','JD Surgical Kits'),
  ('BD302',  'Sterile Drilling Protocol Kit',             'Hervis Schein',NULL,'8500', '5200','SET','1','jd-surgical-kits','JD Surgical Kits'),
  -- ConForm Membran
  ('B31401','ConForm Membran 15×20mm','ACE',NULL,'1124','972', 'PC','5','biomaterial-suturer','ConForm Membran'),
  ('B31402','ConForm Membran 20×20mm','ACE',NULL,'1808','937', 'PC','5','biomaterial-suturer','ConForm Membran'),
  ('B31403','ConForm Membran 30×40mm','ACE',NULL,'2124','1072','PC','5','biomaterial-suturer','ConForm Membran'),
  ('B31404','ConForm Membran 40×60mm','ACE',NULL,'2890','1450','PC','3','biomaterial-suturer','ConForm Membran'),
  -- NuOss Granules
  ('B31471','NuOss Granules Cancellous 0.25-1.0mm 0.5cc','ACE',NULL,'1443','1030','PC','5','biomaterial-suturer','NuOss Granules'),
  ('B31472','NuOss Granules Cancellous 0.25-1.0mm 1cc',  'ACE',NULL,'2613','2062','PC','3','biomaterial-suturer','NuOss Granules'),
  ('B31473','NuOss Granules Cancellous 1.0-2.0mm 0.5cc', 'ACE',NULL,'982', '582', 'PC','5','biomaterial-suturer','NuOss Granules'),
  ('B31474','NuOss Granules Cancellous 1.0-2.0mm 1cc',   'ACE',NULL,'3346','2062','PC','3','biomaterial-suturer','NuOss Granules'),
  -- RC Collagen
  ('B31040','RC Collagen Discs 10mm',        'ACE',NULL,'1078','900', 'PC','5','biomaterial-suturer','RC Collagen'),
  ('B31041','RC Collagen Discs 20mm',        'ACE',NULL,'1450','1100','PC','5','biomaterial-suturer','RC Collagen'),
  ('B31465','RCT Collagen Prop 10mm',        'ACE',NULL,'1565','717', 'PC','5','biomaterial-suturer','RC Collagen'),
  ('B31466','RC Bio Collagen Membran 15×20mm','ACE',NULL,'1303','569','PC','5','biomaterial-suturer','RC Collagen'),
  -- Bio-Gide
  ('BG-1325','Bio-Gide 13×25mm','Geistlich',NULL,'1650','900', 'PC','3','biomaterial-suturer','Bio-Gide'),
  ('BG-2530','Bio-Gide 25×30mm','Geistlich',NULL,'2800','1600','PC','3','biomaterial-suturer','Bio-Gide'),
  ('BG-3040','Bio-Gide 30×40mm','Geistlich',NULL,'4200','2500','PC','2','biomaterial-suturer','Bio-Gide'),
  -- Tetric EvoFlow
  ('IVO-TEF-A1', 'Tetric EvoFlow A1 2×1.8g',  'Ivoclar',NULL,'680','320','BOX','5','composites-bonding','Tetric EvoFlow'),
  ('IVO-TEF-A2', 'Tetric EvoFlow A2 2×1.8g',  'Ivoclar',NULL,'680','320','BOX','5','composites-bonding','Tetric EvoFlow'),
  ('IVO-TEF-A3', 'Tetric EvoFlow A3 2×1.8g',  'Ivoclar',NULL,'680','320','BOX','5','composites-bonding','Tetric EvoFlow'),
  ('IVO-TEF-A3S','Tetric EvoFlow A3.5 2×1.8g','Ivoclar',NULL,'680','320','BOX','5','composites-bonding','Tetric EvoFlow'),
  -- OptiBond Universal
  ('KER-OBU-5', 'OptiBond Universal 5ml', 'Kerr',NULL,'520','240','PC','5','composites-bonding','OptiBond Universal'),
  ('KER-OBU-25','OptiBond Universal 25ml','Kerr',NULL,'980','480','PC','3','composites-bonding','OptiBond Universal'),
  -- ProTaper Gold
  ('DENT-PTG-S1','ProTaper Gold S1 25mm 6-pack','Dentsply',NULL,'850','420','BOX','5','endodontics','ProTaper Gold'),
  ('DENT-PTG-S2','ProTaper Gold S2 25mm 6-pack','Dentsply',NULL,'850','420','BOX','5','endodontics','ProTaper Gold'),
  ('DENT-PTG-F1','ProTaper Gold F1 25mm 6-pack','Dentsply',NULL,'850','420','BOX','5','endodontics','ProTaper Gold'),
  ('DENT-PTG-F2','ProTaper Gold F2 25mm 6-pack','Dentsply',NULL,'850','420','BOX','5','endodontics','ProTaper Gold'),
  -- M-Two Files
  ('VDW-MT-15','M-Two File 15/.05 25mm','VDW',NULL,'620','280','BOX','5','endodontics','M-Two Files'),
  ('VDW-MT-20','M-Two File 20/.05 25mm','VDW',NULL,'620','280','BOX','5','endodontics','M-Two Files'),
  ('VDW-MT-25','M-Two File 25/.06 25mm','VDW',NULL,'650','295','BOX','5','endodontics','M-Two Files'),
  -- Temp-Bond
  ('KER-TB-50','Temp-Bond NE 50ml',   'Kerr',NULL,'380','160','PC','5','prosthodontics','Temp-Bond'),
  ('KER-TB-NE','Temp-Bond NE Refill', 'Kerr',NULL,'290','120','PC','5','prosthodontics','Temp-Bond'),
  -- RelyX Cement
  ('3M-RX-U200','RelyX Ultimate A2 8g','3M ESPE',NULL,'890','440','PC','3','prosthodontics','RelyX Cement'),
  ('3M-RX-U300','RelyX Ultimate B1 8g','3M ESPE',NULL,'890','440','PC','3','prosthodontics','RelyX Cement'),
  -- Caries Detector
  ('KURA-CD-R','Caries Detector Red 5ml',  'Kuraray',NULL,'310','130','PC','5','diagnostics','Caries Detector'),
  ('KURA-CD-G','Caries Detector Green 5ml','Kuraray',NULL,'310','130','PC','5','diagnostics','Caries Detector'),
  -- Steri-Strip
  ('3M-SS-6MM','Steri-Strip 6mm×75mm 50-pack',   '3M',NULL,'280','110','BOX','5','bandages-dressings','Steri-Strip'),
  ('3M-SS-12M','Steri-Strip 12mm×100mm 50-pack',  '3M',NULL,'340','140','BOX','5','bandages-dressings','Steri-Strip'),
  -- Sterile Gauze
  ('GAUZE-5X5',  'Sterile Gauze 5×5cm 100-pack',  'Hartmann',NULL,'180','70', 'BOX','5','bandages-dressings','Sterile Gauze'),
  ('GAUZE-10X10','Sterile Gauze 10×10cm 100-pack', 'Hartmann',NULL,'280','110','BOX','5','bandages-dressings','Sterile Gauze'),
  -- Nitrile Gloves
  ('NITRL-S', 'Nitrile Exam Gloves S 100-pack', 'Sempermed',NULL,'195','85','BOX','5','gloves','Nitrile Exam Gloves'),
  ('NITRL-M', 'Nitrile Exam Gloves M 100-pack', 'Sempermed',NULL,'195','85','BOX','5','gloves','Nitrile Exam Gloves'),
  ('NITRL-L', 'Nitrile Exam Gloves L 100-pack', 'Sempermed',NULL,'195','85','BOX','5','gloves','Nitrile Exam Gloves'),
  ('NITRL-XL','Nitrile Exam Gloves XL 100-pack','Sempermed',NULL,'195','85','BOX','5','gloves','Nitrile Exam Gloves'),
  -- Latex Gloves
  ('LAT-65','Latex Surgical Gloves 6.5 50-pair','Ansell',NULL,'380','170','BOX','3','gloves','Latex Surgical Gloves'),
  ('LAT-70','Latex Surgical Gloves 7.0 50-pair','Ansell',NULL,'380','170','BOX','3','gloves','Latex Surgical Gloves'),
  ('LAT-75','Latex Surgical Gloves 7.5 50-pair','Ansell',NULL,'380','170','BOX','3','gloves','Latex Surgical Gloves'),
  -- Masks
  ('FFP2-20', 'FFP2 Respirator 20-pack',   '3M',NULL,'320','140','BOX','5','masks-protection','FFP2 Respirator'),
  ('SMASK-50','Surgical Face Mask 50-pack', '3M',NULL,'180','70', 'BOX','5','masks-protection','Surgical Face Mask'),
  -- Apparel
  ('GOWN-M', 'Sterile Surgical Gown M','Cardinal',NULL,'85','30','PC','20','surgical-apparel','Surgical Gown'),
  ('CAP-UNI','Surgical Cap Universal',  'Cardinal',NULL,'45','15','PC','20','surgical-apparel','Surgical Cap')
) AS v(ref, name, brand, sec, uprice, cprice, unit, alert, cat_slug, family_name)
JOIN categories c  ON c.slug = v.cat_slug
JOIN product_families pf ON pf.name = v.family_name AND pf.category_id = c.id
ON CONFLICT (ref) DO UPDATE SET
  name           = EXCLUDED.name,
  brand          = EXCLUDED.brand,
  secondary_name = EXCLUDED.secondary_name,
  category_id    = EXCLUDED.category_id,
  family_id      = EXCLUDED.family_id,
  unit_price     = EXCLUDED.unit_price,
  cost_price     = EXCLUDED.cost_price,
  unit           = EXCLUDED.unit,
  alert_quantity = EXCLUDED.alert_quantity,
  is_active      = EXCLUDED.is_active,
  currency       = EXCLUDED.currency;
