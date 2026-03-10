-- =============================================================
-- 004_add_export_flag.sql
-- Добавить флаг выгрузки в Google Sheets для промокодов
-- =============================================================

ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS export_to_sheets BOOLEAN NOT NULL DEFAULT FALSE;
