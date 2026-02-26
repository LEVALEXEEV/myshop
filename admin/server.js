import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });          // базовые / прод
dotenv.config({ path: '.env.local', override: true }); // локальные переопределения

import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
import multer from 'multer';
import bcrypt from 'bcryptjs';

import pg from 'pg';
import pgSession from 'connect-pg-simple';

const { Pool } = pg;
const PgSessionStore = pgSession(session);

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

const PORT = Number(process.env.PORT || 8090);
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const PG_LINK = mustGetEnv('PG_LINK');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = mustGetEnv('ADMIN_PASSWORD_HASH');
const SESSION_SECRET = mustGetEnv('SESSION_SECRET');
const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';

const SHOP_IMAGES_DIR = process.env.SHOP_IMAGES_DIR || '../server/images';
const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const pool = new Pool({ connectionString: PG_LINK });

const app = express();
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (ADMIN_ALLOWED_IPS.length === 0) return next();
  const ip = req.ip;
  if (ADMIN_ALLOWED_IPS.includes(ip)) return next();
  return res.status(403).send('Forbidden');
});

app.use(
  session({
	proxy: true,
    store: new PgSessionStore({
      pool,
      tableName: 'admin_sessions',
      createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: SESSION_COOKIE_SECURE,
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

const csrfProtection = csrf();

let extraImagesModePromise = null;

// returns: 'text_array' | 'jsonb'
async function getExtraImagesMode() {
  if (extraImagesModePromise) return extraImagesModePromise;

  extraImagesModePromise = (async () => {
    try {
      const { rows } = await pool.query(
        `
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'extra_images'
        LIMIT 1
        `
      );

      if (!rows.length) return 'jsonb';
      const { data_type, udt_name } = rows[0];

      // text[] usually: data_type='ARRAY', udt_name='_text'
      if (data_type === 'ARRAY' && udt_name === '_text') return 'text_array';

      // jsonb: data_type='jsonb' (udt_name can also be 'jsonb')
      if (data_type === 'jsonb' || udt_name === 'jsonb') return 'jsonb';

      return 'jsonb';
    } catch (e) {
      console.warn('[admin] could not detect extra_images type, defaulting to jsonb', e);
      return 'jsonb';
    }
  })();

  return extraImagesModePromise;
}

function requireAuth(req, res, next) {
  if (req.session?.user?.username === ADMIN_USERNAME) return next();
  return res.redirect('/login');
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

function normalizeExtraImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function intOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function textOrNull(value) {
  const s = (value ?? '').toString().trim();
  return s ? s : null;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function safeFolder(value) {
  const folder = (value || 'products').toString().trim();
  const allowed = new Set(['products', 'size-charts']);
  return allowed.has(folder) ? folder : 'products';
}

function safeBaseName(value) {
  return (value || 'upload')
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-');
}

app.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.get('/login', loginLimiter, csrfProtection, (req, res) => {
  res.render('login', {
    csrfToken: req.csrfToken(),
    publicUrl: PUBLIC_URL,
    error: null,
  });
});

app.post('/login', loginLimiter, csrfProtection, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const userOk = username === ADMIN_USERNAME;
  const passOk = typeof password === 'string' && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!userOk || !passOk) {
    return res.status(401).render('login', {
      csrfToken: req.csrfToken(),
      publicUrl: PUBLIC_URL,
      error: 'Неверный логин или пароль',
    });
  }

  req.session.user = { username: ADMIN_USERNAME };
  return res.redirect('/products');
}));

app.post('/logout', csrfProtection, (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', requireAuth, (req, res) => res.redirect('/products'));

app.get('/products', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, price, category, image, sold_out FROM products ORDER BY id DESC'
  );
  res.render('products', {
    csrfToken: req.csrfToken(),
    products: rows,
  });
}));

app.get('/products/new', requireAuth, csrfProtection, (req, res) => {
  res.render('product_form', {
    csrfToken: req.csrfToken(),
    mode: 'create',
    product: {
      title: '',
      price: 0,
      category: '',
      image: '',
      image_hover: '',
      extra_images_text: '',
      description: '',
      size_chart: '',
      sold_out: false,
    },
  });
});

app.post('/products', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const title = (req.body.title || '').trim();
  const price = intOrNull(req.body.price);
  const category = (req.body.category || '').trim() || 'Все';
  const image = (req.body.image || '').trim();

  if (!title || price === null || price < 0 || !image) {
    return res.status(400).send('Invalid product data');
  }

  const image_hover = textOrNull(req.body.image_hover);
  const extra_images = normalizeExtraImages(req.body.extra_images_text);
  const description = (req.body.description || '').toString();
  const size_chart = textOrNull(req.body.size_chart);
  const sold_out = req.body.sold_out === 'on';

  const extraImagesMode = await getExtraImagesMode();
  const extraImagesSql = extraImagesMode === 'text_array' ? '$6::text[]' : '$6::jsonb';
  const extraImagesValue = extraImagesMode === 'text_array' ? extra_images : JSON.stringify(extra_images);

  const { rows } = await pool.query(
    `INSERT INTO products (title, price, category, image, image_hover, extra_images, description, size_chart, sold_out)
     VALUES ($1,$2,$3,$4,$5,${extraImagesSql},$7,$8,$9)
     RETURNING id`,
    [
      title,
      price,
      category,
      image,
      image_hover,
      extraImagesValue,
      description,
      size_chart,
      sold_out,
    ]
  );

  res.redirect(`/products/${rows[0].id}`);
}));

app.get('/products/:id', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  const product = rows[0];
  if (!product) return res.status(404).send('Not found');

  res.render('product_form', {
    csrfToken: req.csrfToken(),
    mode: 'edit',
    product: {
      ...product,
      extra_images_text: (Array.isArray(product.extra_images) ? product.extra_images : []).join('\n'),
    },
  });
}));

app.post('/products/:id', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const title = (req.body.title || '').trim();
  const price = intOrNull(req.body.price);
  const category = (req.body.category || '').trim() || 'Все';
  const image = (req.body.image || '').trim();

  if (!title || price === null || price < 0 || !image) {
    return res.status(400).send('Invalid product data');
  }

  const image_hover = textOrNull(req.body.image_hover);
  const extra_images = normalizeExtraImages(req.body.extra_images_text);
  const description = (req.body.description || '').toString();
  const size_chart = textOrNull(req.body.size_chart);
  const sold_out = req.body.sold_out === 'on';

  const extraImagesMode = await getExtraImagesMode();
  const extraImagesSql = extraImagesMode === 'text_array' ? '$6::text[]' : '$6::jsonb';
  const extraImagesValue = extraImagesMode === 'text_array' ? extra_images : JSON.stringify(extra_images);

  await pool.query(
    `UPDATE products
     SET title=$1, price=$2, category=$3, image=$4, image_hover=$5, extra_images=${extraImagesSql}, description=$7, size_chart=$8, sold_out=$9
     WHERE id=$10`,
    [
      title,
      price,
      category,
      image,
      image_hover,
      extraImagesValue,
      description,
      size_chart,
      sold_out,
      id,
    ]
  );

  res.redirect(`/products/${id}`);
}));

app.post('/products/:id/delete', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
  res.redirect('/products');
}));

app.get('/products/:id/stock', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const productRes = await pool.query('SELECT id, title FROM products WHERE id = $1', [id]);
  const product = productRes.rows[0];
  if (!product) return res.status(404).send('Not found');

  const stockRes = await pool.query(
    'SELECT size, qty FROM product_stock WHERE product_id = $1 ORDER BY size ASC',
    [id]
  );

  res.render('stock', {
    csrfToken: req.csrfToken(),
    product,
    stock: stockRes.rows,
  });
}));

app.post('/products/:id/stock', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const sizesRaw = req.body.size;
  const qtyRaw = req.body.qty;

  const sizes = Array.isArray(sizesRaw) ? sizesRaw : (sizesRaw ? [sizesRaw] : []);
  const qtys = Array.isArray(qtyRaw) ? qtyRaw : (qtyRaw ? [qtyRaw] : []);

  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM product_stock WHERE product_id = $1', [id]);

    for (let i = 0; i < sizes.length; i++) {
      const size = (sizes[i] || '').toString().trim();
      const qty = intOrNull(qtys[i]);
      if (!size) continue;
      if (qty === null || qty < 0) continue;
      await pool.query(
        'INSERT INTO product_stock (product_id, size, qty) VALUES ($1,$2,$3)',
        [id, size, qty]
      );
    }

    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }

  res.redirect(`/products/${id}/stock`);
}));

app.post('/upload', requireAuth, upload.single('file'), csrfProtection, asyncHandler(async (req, res) => {
  const folder = safeFolder(req.body.folder);
  const baseName = safeBaseName(req.body.baseName);

  const file = req.file;
  if (!file) return res.status(400).send('No file');

  const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
  const suffix = crypto.randomBytes(6).toString('hex');
  const fileName = `${baseName}-${suffix}${ext}`;

  const destDir = path.resolve(process.cwd(), SHOP_IMAGES_DIR, folder);
  await ensureDir(destDir);
  await fs.writeFile(path.join(destDir, fileName), file.buffer);

  const publicPath = `/images/${folder}/${fileName}`;

  const productId = Number(req.body.productId);
  const field = (req.body.field || 'image').toString();
  const allowedFields = new Set(['image', 'image_hover', 'size_chart', 'extra_images']);

  if (Number.isFinite(productId) && allowedFields.has(field)) {
    if (field === 'extra_images') {
      const extraImagesMode = await getExtraImagesMode();
      if (extraImagesMode === 'text_array') {
        await pool.query(
          'UPDATE products SET extra_images = array_append(COALESCE(extra_images, ARRAY[]::text[]), $1) WHERE id = $2',
          [publicPath, productId]
        );
      } else {
        await pool.query(
          "UPDATE products SET extra_images = COALESCE(extra_images, '[]'::jsonb) || to_jsonb(ARRAY[$1]::text[]) WHERE id = $2",
          [publicPath, productId]
        );
      }
    } else {
      await pool.query(`UPDATE products SET ${field} = $1 WHERE id = $2`, [publicPath, productId]);
    }
    return res.redirect(`/products/${productId}`);
  }

  res.json({ path: publicPath });
}));

app.use((err, req, res, next) => {
  const requestId = crypto.randomUUID();
  console.error(`[admin] error ${requestId}`, err);
  const status = err.code === 'EBADCSRFTOKEN' ? 403 : 500;
  res.status(status).send(status === 403 ? 'CSRF token invalid' : `Internal error (${requestId})`);
});

app.listen(PORT, () => {
  console.log(`[admin] running on ${PUBLIC_URL}`);
});
