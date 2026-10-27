-- Product enhancements: cost price, discount percent, size-wise inventory

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS size_stock JSONB NOT NULL DEFAULT '{}';

-- Backfill cost_price from specifications JSON where present
UPDATE products
SET cost_price = (specifications->>'cost_price')::DECIMAL
WHERE cost_price IS NULL
  AND specifications ? 'cost_price'
  AND (specifications->>'cost_price') ~ '^[0-9]+\.?[0-9]*$';

UPDATE products
SET discount_percent = (specifications->>'discount_percent')::DECIMAL * 100
WHERE discount_percent IS NULL
  AND specifications ? 'discount_percent'
  AND (specifications->>'discount_percent')::DECIMAL <= 1;

UPDATE products
SET discount_percent = (specifications->>'discount_percent')::DECIMAL
WHERE discount_percent IS NULL
  AND specifications ? 'discount_percent'
  AND (specifications->>'discount_percent')::DECIMAL > 1;

CREATE INDEX IF NOT EXISTS idx_products_size_stock ON products USING GIN (size_stock);
