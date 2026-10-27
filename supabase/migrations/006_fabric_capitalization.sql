-- Capitalize fabric names and ensure full fabric catalog

UPDATE fabrics
SET
  name = INITCAP(name),
  slug = LOWER(REGEXP_REPLACE(INITCAP(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE name <> INITCAP(name);

INSERT INTO fabrics (name, slug, description, is_active) VALUES
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
