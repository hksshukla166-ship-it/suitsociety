-- Ensure homepage_heroes exists (fixes hero_slides / homepage_heroes mismatch)
CREATE TABLE IF NOT EXISTS homepage_heroes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  button_text TEXT DEFAULT 'Shop Now',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate data from legacy hero_slides table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hero_slides'
  ) THEN
    INSERT INTO homepage_heroes (
      id, title, subtitle, image_url, mobile_image_url, link_url,
      button_text, sort_order, is_active, created_at, updated_at
    )
    SELECT
      id, title, subtitle, image_url, mobile_image_url, link_url,
      COALESCE(button_text, 'Shop Now'), sort_order, is_active, created_at, updated_at
    FROM hero_slides
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE homepage_heroes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_heroes'
      AND policyname = 'Public can view active heroes'
  ) THEN
    CREATE POLICY "Public can view active heroes"
      ON homepage_heroes FOR SELECT
      USING (is_active = true);
  END IF;
END $$;
