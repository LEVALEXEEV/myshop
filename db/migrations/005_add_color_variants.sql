-- =============================================================
-- 005_add_color_variants.sql
-- Поддержка товаров без размера, но с разными цветами.
-- =============================================================

BEGIN;

-- ─── products ────────────────────────────────────────────────
-- variant_type определяет, чем выбирает покупатель: размером ('size')
-- или цветом ('color'). По умолчанию 'size' для совместимости.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_type VARCHAR(10) NOT NULL DEFAULT 'size';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_variant_type_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_variant_type_check
      CHECK (variant_type IN ('size', 'color'));
  END IF;
END
$$;

-- colors — список доступных цветов для товаров с variant_type='color'.
-- Хранится как jsonb-массив объектов { name, hex }.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb;


-- ─── product_stock ───────────────────────────────────────────
-- Добавляем колонку color. Соглашение:
--   * для size-товара:  size != '', color = ''
--   * для color-товара: size = '', color != ''
-- size теперь имеет DEFAULT '' и больше не входит в "натуральный" ключ
-- в одиночку.
ALTER TABLE product_stock
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '';

ALTER TABLE product_stock
  ALTER COLUMN size SET DEFAULT '';

-- Сменить PK с (product_id, size) на (product_id, size, color).
ALTER TABLE product_stock DROP CONSTRAINT IF EXISTS product_stock_pkey;
ALTER TABLE product_stock
  ADD CONSTRAINT product_stock_pkey PRIMARY KEY (product_id, size, color);

-- Дополнительная защита: ровно одно из (size, color) должно быть непустым.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_stock_variant_check'
  ) THEN
    ALTER TABLE product_stock
      ADD CONSTRAINT product_stock_variant_check
      CHECK ((size <> '' AND color = '') OR (size = '' AND color <> ''));
  END IF;
END
$$;


-- ─── trg_sync_paired_stock ───────────────────────────────────
-- Обновляем триггер: парные товары теперь синхронизируются и по color тоже.
CREATE OR REPLACE FUNCTION public.trg_sync_paired_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  buddy int;
  diff  int;
  new_q int;
  v_size  text := COALESCE(NEW.size,  OLD.size);
  v_color text := COALESCE(NEW.color, OLD.color);
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  SELECT paired_product
    INTO buddy
    FROM product_pairs
   WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

  IF buddy IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    diff := NEW.qty;
  ELSIF TG_OP = 'UPDATE' THEN
    diff := NEW.qty - OLD.qty;
  ELSE
    diff := -OLD.qty;
  END IF;

  IF diff = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE product_stock
     SET qty = qty + diff
   WHERE product_id = buddy
     AND size  = v_size
     AND color = v_color;

  IF NOT FOUND AND diff > 0 THEN
    INSERT INTO product_stock (product_id, size, color, qty)
    VALUES (buddy, v_size, v_color, diff);
  END IF;

  SELECT qty
    INTO new_q
    FROM product_stock
   WHERE product_id = buddy
     AND size  = v_size
     AND color = v_color;

  IF new_q < 0 THEN
    RAISE EXCEPTION 'Недостаточно парного товара (id %, size %, color %)',
      buddy, v_size, v_color;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
