-- Add product code (barcode) snapshot to order items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_code TEXT;

-- One review per user per product (safe if table already exists without constraint)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_user_unique'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_product_user_unique UNIQUE (product_id, user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;
