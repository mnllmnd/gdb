-- Migration: add reviews table for product and shop reviews/comments
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure a user can only leave one review per product and one per shop (partial unique indexes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_unique_product_user') THEN
    CREATE UNIQUE INDEX reviews_unique_product_user ON reviews (user_id, product_id) WHERE product_id IS NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_unique_shop_user') THEN
    CREATE UNIQUE INDEX reviews_unique_shop_user ON reviews (user_id, shop_id) WHERE shop_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'reviews partial unique indexes skipped: %', SQLERRM;
END$$;
