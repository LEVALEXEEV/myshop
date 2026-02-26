import path from 'node:path';
import crypto from 'node:crypto';

import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import pgSession from 'connect-pg-simple';

import { PORT, PUBLIC_URL, SESSION_SECRET, SESSION_COOKIE_SECURE } from './config.js';
import pool from './db.js';
import { ipFilter } from './middleware/ipFilter.js';
import { asyncHandler } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import productsRouter from './routes/products.js';
import stockRouter from './routes/stock.js';
import promosRouter from './routes/promos.js';
import uploadRouter from './routes/upload.js';

const PgSessionStore = pgSession(session);

const app = express();
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// ── Security ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── Body parsing ────────────────────────────────────────────
app.use(express.urlencoded({ extended: false }));

// ── IP whitelist ────────────────────────────────────────────
app.use(ipFilter);

// ── Session ─────────────────────────────────────────────────
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

// ── Health ───────────────────────────────────────────────────
app.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// ── Routes ───────────────────────────────────────────────────
app.use('/', authRoutes);
app.get('/', (req, res) => res.redirect('/products'));
app.use('/products', productsRouter);
app.use('/products/:id/stock', stockRouter);
app.use('/promos', promosRouter);
app.use('/upload', uploadRouter);

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  const requestId = crypto.randomUUID();
  console.error(`[admin] error ${requestId}`, err);
  const status = err.code === 'EBADCSRFTOKEN' ? 403 : 500;
  res.status(status).send(status === 403 ? 'CSRF token invalid' : `Internal error (${requestId})`);
});

app.listen(PORT, () => {
  console.log(`[admin] running on ${PUBLIC_URL}`);
});
