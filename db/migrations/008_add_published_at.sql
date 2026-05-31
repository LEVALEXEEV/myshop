-- =============================================================
-- 008_add_published_at.sql
-- Время публикации товара. Товар виден в каталоге, если
-- published = TRUE и published_at <= NOW().
-- =============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
