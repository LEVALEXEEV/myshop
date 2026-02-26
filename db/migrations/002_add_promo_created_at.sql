-- Добавляем created_at в promo_codes, если ещё нет
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
