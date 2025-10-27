-- Migration: add product_reels, reel_likes, reel_comments
-- Run once. Safe to re-run with IF NOT EXISTS checks

CREATE TABLE IF NOT EXISTS product_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  caption TEXT,
  duration_seconds INTEGER,
  visibility TEXT DEFAULT 'public', -- public | private
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reels_product_id ON product_reels(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reels_user_id ON product_reels(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reels_created_at ON product_reels(created_at DESC);

CREATE TABLE IF NOT EXISTS reel_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID REFERENCES product_reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);

CREATE TABLE IF NOT EXISTS reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID REFERENCES product_reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES reel_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id);

-- Trigger to update updated_at on modify (optional, depends on extensions)
