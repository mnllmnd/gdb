-- Add quantity / stock field to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0 NOT NULL;

-- Optional: create an index if we will query by out-of-stock products
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
