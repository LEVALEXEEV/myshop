-- =============================================================
-- 003_align_local_with_prod.sql
-- Выравнивание локальной схемы по prod-схеме
-- =============================================================

BEGIN;

-- ═════════════════════════════════════════════════════════════
-- 1. products — типы колонок, NOT NULL, DEFAULT
-- ═════════════════════════════════════════════════════════════

-- extra_images: jsonb DEFAULT '[]' → TEXT[] (только если ещё jsonb)
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'products'
     AND column_name  = 'extra_images';

  IF col_type = 'jsonb' THEN
    CREATE OR REPLACE FUNCTION _tmp_jsonb_to_text_array(j jsonb)
    RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
      SELECT CASE
        WHEN j IS NULL OR jsonb_typeof(j) <> 'array' THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(j))
      END;
    $f$;

    ALTER TABLE products ALTER COLUMN extra_images DROP DEFAULT;
    ALTER TABLE products ALTER COLUMN extra_images TYPE text[]
      USING _tmp_jsonb_to_text_array(extra_images);

    DROP FUNCTION _tmp_jsonb_to_text_array(jsonb);
  END IF;
END
$$;

-- title: text NOT NULL → VARCHAR(255)
ALTER TABLE products ALTER COLUMN title DROP NOT NULL;
ALTER TABLE products ALTER COLUMN title TYPE VARCHAR(255);

-- price: integer NOT NULL → INTEGER (nullable)
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;

-- category: text → VARCHAR(50)
ALTER TABLE products ALTER COLUMN category TYPE VARCHAR(50);

-- image: text → VARCHAR(255)
ALTER TABLE products ALTER COLUMN image TYPE VARCHAR(255);

-- image_hover: text → VARCHAR(255)
ALTER TABLE products ALTER COLUMN image_hover TYPE VARCHAR(255);

-- size_chart: text → VARCHAR(255)
ALTER TABLE products ALTER COLUMN size_chart TYPE VARCHAR(255);

-- sold_out: NOT NULL → nullable
ALTER TABLE products ALTER COLUMN sold_out DROP NOT NULL;

-- description: DEFAULT '' → no default
ALTER TABLE products ALTER COLUMN description DROP DEFAULT;


-- ═════════════════════════════════════════════════════════════
-- 2. orders — типы колонок, agree_policy, created_at
-- ═════════════════════════════════════════════════════════════

ALTER TABLE orders ALTER COLUMN full_name TYPE VARCHAR(255);
ALTER TABLE orders ALTER COLUMN email     TYPE VARCHAR(255);
ALTER TABLE orders ALTER COLUMN phone     TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN shipping_method TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN promo     TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN status    TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN telegram  TYPE VARCHAR(64);

-- agree_policy: DEFAULT TRUE → DEFAULT FALSE
ALTER TABLE orders ALTER COLUMN agree_policy SET DEFAULT FALSE;

-- created_at: NOT NULL → nullable
ALTER TABLE orders ALTER COLUMN created_at DROP NOT NULL;


-- ═════════════════════════════════════════════════════════════
-- 3. promo_codes — убрать id, сделать code PK, типы, defaults
-- ═════════════════════════════════════════════════════════════

-- Удалить текущий PK (на id)
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_pkey;

-- Удалить колонку id
ALTER TABLE promo_codes DROP COLUMN IF EXISTS id;

-- Удалить последовательность
DROP SEQUENCE IF EXISTS promo_codes_id_seq;

-- Удалить UNIQUE на code (станет PK)
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_code_key;

-- Привести типы
ALTER TABLE promo_codes ALTER COLUMN code TYPE VARCHAR(50);
ALTER TABLE promo_codes ALTER COLUMN discount_percent TYPE SMALLINT;

-- Изменить defaults
ALTER TABLE promo_codes ALTER COLUMN single_use SET DEFAULT TRUE;
ALTER TABLE promo_codes ALTER COLUMN metadata SET NOT NULL;
ALTER TABLE promo_codes ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- PK на code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_pkey'
  ) THEN
    ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (code);
  END IF;
END
$$;

-- CHECK constraints (IF NOT EXISTS не поддерживается — используем DO-блок)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_discount_percent_check'
  ) THEN
    ALTER TABLE promo_codes
      ADD CONSTRAINT promo_codes_discount_percent_check
      CHECK (discount_percent >= 1 AND discount_percent <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'single_use_max_usage'
  ) THEN
    ALTER TABLE promo_codes
      ADD CONSTRAINT single_use_max_usage
      CHECK ((NOT single_use) OR (usage_count <= 1));
  END IF;
END
$$;


-- ═════════════════════════════════════════════════════════════
-- 4. subscribers — добавить id SERIAL, сделать PK на id
-- ═════════════════════════════════════════════════════════════

-- Убрать текущий PK (на email)
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_pkey;

-- Добавить колонку id
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS id INTEGER;

-- Заполнить id для существующих строк
UPDATE subscribers SET id = nextval('subscribers_id_seq') WHERE id IS NULL;

-- Настроить колонку
ALTER TABLE subscribers ALTER COLUMN id SET NOT NULL;
ALTER TABLE subscribers ALTER COLUMN id SET DEFAULT nextval('subscribers_id_seq');
ALTER SEQUENCE subscribers_id_seq OWNED BY subscribers.id;

-- Сбросить seq на max id
SELECT setval('subscribers_id_seq', COALESCE((SELECT MAX(id) FROM subscribers), 0));

-- PK на id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscribers_pkey'
  ) THEN
    ALTER TABLE subscribers ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);
  END IF;
END
$$;

-- email UNIQUE уже есть (subscribers_email_key)


-- ═════════════════════════════════════════════════════════════
-- 5. product_stock — добавить CHECK (qty >= 0)
-- ═════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_stock_qty_check'
  ) THEN
    ALTER TABLE product_stock
      ADD CONSTRAINT product_stock_qty_check CHECK (qty >= 0);
  END IF;
END
$$;


-- ═════════════════════════════════════════════════════════════
-- 6. admin_sessions — expire → TIMESTAMP(6)
-- ═════════════════════════════════════════════════════════════

ALTER TABLE admin_sessions ALTER COLUMN expire TYPE TIMESTAMP(6);


-- ═════════════════════════════════════════════════════════════
-- 7. Удалить дублирующие FK на product_pairs
-- ═════════════════════════════════════════════════════════════

ALTER TABLE product_pairs DROP CONSTRAINT IF EXISTS product_pairs_product_id_fkey;
ALTER TABLE product_pairs DROP CONSTRAINT IF EXISTS product_pairs_paired_product_fkey;
-- Остаются: fk_prod и fk_prod_pair


-- ═════════════════════════════════════════════════════════════
-- 8. Удалить дублирующий индекс admin_sessions_expire_idx
-- ═════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS admin_sessions_expire_idx;
-- Остаётся: IDX_session_expire


-- ═════════════════════════════════════════════════════════════
-- 9. orders_status_created_idx — есть в local, нет в prod
--    Полезный индекс для админки, удалить для точного соответствия
-- ═════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS orders_status_created_idx;


-- ═════════════════════════════════════════════════════════════
-- 10. product_stock — убрать DEFAULT 0 (prod: без default)
-- ═════════════════════════════════════════════════════════════

ALTER TABLE product_stock ALTER COLUMN qty DROP DEFAULT;


-- ═════════════════════════════════════════════════════════════
-- 11. admin_sessions — переименовать PK constraint → session_pkey
-- ═════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_sessions_pkey'
  ) THEN
    ALTER TABLE admin_sessions RENAME CONSTRAINT admin_sessions_pkey TO session_pkey;
  END IF;
END
$$;


COMMIT;
