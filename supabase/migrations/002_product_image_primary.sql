-- Fix product_images schema (adds missing is_primary column)
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Backfill: lowest sort_order image per product is primary
UPDATE product_images pi
SET is_primary = TRUE
FROM (
  SELECT DISTINCT ON (product_id) id
  FROM product_images
  ORDER BY product_id, sort_order ASC, created_at ASC
) first_image
WHERE pi.id = first_image.id;
