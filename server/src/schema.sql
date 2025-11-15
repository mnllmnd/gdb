-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- pgvector extension is required for vector column type and nearest-neighbor ops
-- Make sure your Postgres instance has the pgvector extension available.
CREATE EXTENSION IF NOT EXISTS vector;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- vector embedding for similarity search (requires pgvector extension)
  -- dimension must match the model used to compute embeddings. The default
  -- embedder used by the server (all-miniLM-L6-v2) produces 384-d vectors.
  embedding vector(384),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Shops (one per seller)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  domain TEXT UNIQUE,
  logo_url TEXT,
  description TEXT,
  debts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT,
  price NUMERIC,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cash_on_delivery',
  buyer_name TEXT,
  buyer_phone TEXT,
  address TEXT,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
