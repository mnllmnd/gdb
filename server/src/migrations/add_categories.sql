-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add default categories
INSERT INTO categories (name) VALUES 
('Vêtements'),
('Accessoires'),
('Art & Décoration'),
('Bijoux'),
('Maison'),
('Cosmétiques'),
('Alimentation'),
('Autres');

-- Add category_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Update existing products to have a default category (Autres)
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Autres') WHERE category_id IS NULL;

-- Make category_id required for future products
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;