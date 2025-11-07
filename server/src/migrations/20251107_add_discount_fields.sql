-- Add discount fields to products table
ALTER TABLE products
ADD COLUMN original_price NUMERIC,
ADD COLUMN discount INTEGER CHECK (discount >= 0 AND discount <= 100);

-- Update original_price with current price for existing products
UPDATE products
SET original_price = price
WHERE original_price IS NULL;