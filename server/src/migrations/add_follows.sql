-- Create table to follow users (user -> user)
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (follower_id, followed_user_id)
);

-- Create table to follow shops (user -> shop)
CREATE TABLE IF NOT EXISTS shop_follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, shop_id)
);

-- Optional: ensure an index for fast follower counts
CREATE INDEX IF NOT EXISTS idx_shop_follows_shop_id ON shop_follows(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_user_id ON user_follows(followed_user_id);
