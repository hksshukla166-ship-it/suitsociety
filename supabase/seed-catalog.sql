-- Full category, fabric, color, and size catalog for Suit Society
-- Run in Supabase SQL Editor

INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
  ('Readymade 3-pc Suits', 'readymade-3-pc-suits', 'Ready-to-wear three piece suit sets', 1, true),
  ('Korean Shirts/ Midis', 'korean-shirts-midis', 'Korean style shirts and midi dresses', 2, true),
  ('Wedding/Festive collection', 'wedding-festive-collection', 'Wedding and festive occasion wear', 3, true),
  ('Co-Ord Sets', 'co-ord-sets', 'Coordinated ethnic and casual wear sets', 4, true),
  ('Winter Wear', 'winter-wear', 'Warm winter clothing collection', 5, true),
  ('Night Suits', 'night-suits', 'Comfortable night suits and sleepwear', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- All 16 fabrics from the product spreadsheet
INSERT INTO fabrics (name, slug, description, is_active) VALUES
  ('Cotton', 'cotton', 'Breathable cotton fabric', true),
  ('Imported Fabric', 'imported-fabric', 'Premium imported fabric', true),
  ('Silk', 'silk', 'Silk and silk-blend fabric', true),
  ('Mul Cotton', 'mul-cotton', 'Soft mul cotton fabric', true),
  ('Dola Silk', 'dola-silk', 'Dola silk fabric', true),
  ('Georgette', 'georgette', 'Lightweight georgette fabric', true),
  ('Chiffon', 'chiffon', 'Sheer chiffon fabric', true),
  ('Linen', 'linen', 'Natural linen fabric', true),
  ('Velvet', 'velvet', 'Rich velvet fabric', true),
  ('Organza', 'organza', 'Crisp organza fabric', true),
  ('Crepe', 'crepe', 'Textured crepe fabric', true),
  ('Rayon', 'rayon', 'Soft rayon fabric', true),
  ('Net', 'net', 'Decorative net fabric', true),
  ('Jacquard', 'jacquard', 'Woven jacquard fabric', true),
  ('Satin', 'satin', 'Smooth satin fabric', true),
  ('Khadi', 'khadi', 'Handwoven khadi fabric', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- Capitalize any existing lowercase fabric names
UPDATE fabrics
SET name = INITCAP(name)
WHERE name <> INITCAP(name);

-- Default catalog sizes (S through 7XL)
INSERT INTO settings (key, value) VALUES
  ('catalog_sizes', '{"sizes":["S","M","L","XL","XXL","3XL","4XL","5XL","6XL","7XL"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Default catalog colors including Lavender, Rust, Off White
INSERT INTO settings (key, value) VALUES
  ('catalog_colors', '{"colors":["Black","White","Blue","Red","Green","Yellow","Pink","Purple","Grey","Brown","Cream","Beige","Maroon","Navy","Multi Color","Golden","Ivory","Lavender","Rust","Off White"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
