-- =============================================================
-- 006_move_colors_to_stock.sql
-- Перенос списка цветов из products.colors в product_stock.color_hex.
-- Каждая запись product_stock теперь несёт собственный HEX-код цвета.
-- =============================================================

BEGIN;

-- Добавляем HEX-колонку.
ALTER TABLE product_stock
  ADD COLUMN IF NOT EXISTS color_hex TEXT NOT NULL DEFAULT '';

-- Если в products.colors уже что-то лежало — переносим hex в существующие
-- записи product_stock по совпадению имени цвета.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'colors'
  ) THEN
    UPDATE product_stock ps
       SET color_hex = COALESCE(c.hex, '')
      FROM products p,
           LATERAL jsonb_to_recordset(p.colors) AS c(name text, hex text)
     WHERE ps.product_id = p.id
       AND ps.color = c.name
       AND ps.color <> '';
  END IF;
END
$$;

-- Согласованность: для размер-строк hex обязан быть пустым,
-- для цвет-строк — наоборот, непустым.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_stock_color_hex_check'
  ) THEN
    ALTER TABLE product_stock
      ADD CONSTRAINT product_stock_color_hex_check
      CHECK ((color = '' AND color_hex = '') OR (color <> '' AND color_hex <> ''));
  END IF;
END
$$;

-- Удаляем колонку products.colors — теперь источник правды по цветам это
-- product_stock.
ALTER TABLE products DROP COLUMN IF EXISTS colors;

COMMIT;
