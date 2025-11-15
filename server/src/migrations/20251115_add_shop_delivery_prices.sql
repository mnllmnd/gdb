-- Migration: add delivery price columns to shops table
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS delivery_price_local NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_price_regional NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_price_express NUMERIC DEFAULT 0;

-- Optionally ensure values are non-negative
ALTER TABLE shops
  ALTER COLUMN delivery_price_local SET DEFAULT 0,
  ALTER COLUMN delivery_price_regional SET DEFAULT 0,
  ALTER COLUMN delivery_price_express SET DEFAULT 0;

-- Add check constraints to enforce non-negative prices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shops_delivery_price_non_negative') THEN
    ALTER TABLE shops ADD CONSTRAINT shops_delivery_price_non_negative CHECK (
      COALESCE(delivery_price_local,0) >= 0 AND
      COALESCE(delivery_price_regional,0) >= 0 AND
      COALESCE(delivery_price_express,0) >= 0
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add delivery price check constraint: %', SQLERRM;
END$$;
