-- =============================================================
-- 001_init.sql — начальная схема базы данных myshop
-- =============================================================

-- ─── ФУНКЦИИ-ТРИГГЕРЫ ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_refresh_sold_out()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  left_total int;
BEGIN
  SELECT COALESCE(SUM(qty), 0)
    INTO left_total
    FROM product_stock
   WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products
     SET sold_out = (left_total = 0)
   WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_paired_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  buddy int;
  diff  int;
  new_q int;
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
     AND size = COALESCE(NEW.size, OLD.size);

  IF NOT FOUND AND diff > 0 THEN
    INSERT INTO product_stock (product_id, size, qty)
    VALUES (buddy, COALESCE(NEW.size, OLD.size), diff);
  END IF;

  SELECT qty
    INTO new_q
    FROM product_stock
   WHERE product_id = buddy
     AND size = COALESCE(NEW.size, OLD.size);

  IF new_q < 0 THEN
    RAISE EXCEPTION 'Недостаточно парного товара (id %, size %)', buddy, NEW.size;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── ТАБЛИЦЫ ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(50),
  title       VARCHAR(255),
  price       INTEGER,
  image       VARCHAR(255),
  sold_out    BOOLEAN DEFAULT FALSE,
  image_hover VARCHAR(255),
  extra_images TEXT[],
  sizes       TEXT[],
  description TEXT,
  size_chart  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.product_stock (
  product_id INTEGER NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  size       TEXT    NOT NULL,
  qty        INTEGER NOT NULL,
  CONSTRAINT product_stock_pkey    PRIMARY KEY (product_id, size),
  CONSTRAINT product_stock_qty_check CHECK (qty >= 0)
);

CREATE TABLE IF NOT EXISTS public.product_pairs (
  product_id     INTEGER NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  paired_product INTEGER NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT product_pairs_pkey PRIMARY KEY (product_id),
  CONSTRAINT no_self_pair CHECK (product_id <> paired_product)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(50)  NOT NULL,
  shipping_method VARCHAR(50)  NOT NULL,
  promo           VARCHAR(50),
  items           JSONB        NOT NULL,
  total           INTEGER      NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  status          VARCHAR(50)  NOT NULL DEFAULT 'pending',
  agree_policy    BOOLEAN      NOT NULL DEFAULT FALSE,
  address         TEXT,
  coords          JSONB,
  telegram        VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  code             VARCHAR(50) PRIMARY KEY,
  discount_percent SMALLINT    NOT NULL,
  single_use       BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ,
  usage_count      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata         JSONB       NOT NULL DEFAULT '{}',
  CONSTRAINT promo_codes_discount_percent_check CHECK (discount_percent BETWEEN 1 AND 100),
  CONSTRAINT single_use_max_usage CHECK ((NOT single_use) OR (usage_count <= 1))
);

CREATE TABLE IF NOT EXISTS public.subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  agreed     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  sid    VARCHAR     NOT NULL PRIMARY KEY,
  sess   JSON        NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- ─── ИНДЕКСЫ ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
  ON public.admin_sessions (expire);

CREATE INDEX IF NOT EXISTS idx_orders_telegram
  ON public.orders (telegram);

CREATE INDEX IF NOT EXISTS idx_promo_expires_at
  ON public.promo_codes (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_promo_fp
  ON public.promo_codes ((metadata ->> 'fp'));

-- ─── ТРИГГЕРЫ ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS t_stock_changed ON public.product_stock;
CREATE TRIGGER t_stock_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.product_stock
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_sold_out();

DROP TRIGGER IF EXISTS t_sync_paired_stock ON public.product_stock;
CREATE TRIGGER t_sync_paired_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.product_stock
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_paired_stock();
