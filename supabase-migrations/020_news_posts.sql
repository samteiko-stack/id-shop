-- News posts for storefront CMS
CREATE TABLE IF NOT EXISTS news_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  excerpt       TEXT,
  body          TEXT NOT NULL,
  image_url     TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON news_posts(published_at DESC)
  WHERE deleted_at IS NULL AND is_published = true;

CREATE OR REPLACE FUNCTION update_news_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_posts_updated_at ON news_posts;
CREATE TRIGGER news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_news_posts_updated_at();

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published news"
  ON news_posts FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "Staff and admin full access to news_posts"
  ON news_posts FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

COMMENT ON TABLE news_posts IS 'Storefront news articles managed from admin CMS';
