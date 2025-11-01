-- Migration: add product_images table to support multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Backfill: if products.image_url exists, copy it into product_images
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    INSERT INTO product_images (product_id, url, position)
    SELECT id, image_url, 0 FROM products WHERE image_url IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore in case this runs on DBs without gen_random_uuid or missing products table
  RAISE NOTICE 'product_images backfill skipped: %', SQLERRM;
END$$;
