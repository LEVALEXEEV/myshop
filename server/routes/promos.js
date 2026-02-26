// server/routes/promos.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.PG_LINK,
});

// Ограничитель для генерации промокодов
const promoLimiter = rateLimit({
  windowMs: 5 * 60_000, // 5 минут
  max: 5,
  message: { error: 'Too many promo requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Утилита для получения fingerprint клиента
function getFP(req) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto
    .createHash('sha256')
    .update(ip + ua)
    .digest('hex');
}

// Проверить действующий промокод
router.get('/api/promos/check', async (req, res) => {
  const fp = getFP(req);
  const now = new Date();
  try {
    const { rows } = await pool.query(
      `SELECT code, discount_percent, expires_at
         FROM promo_codes
        WHERE metadata->>'fp' = $1
          AND expires_at > $2
        LIMIT 1`,
      [fp, now]
    );
    if (!rows.length) return res.sendStatus(204);
    const p = rows[0];
    res.json({
      code: p.code,
      discount_percent: p.discount_percent,
      expires_at: p.expires_at.toISOString(),
    });
  } catch (err) {
    console.error('Ошибка при проверке промокода:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// === проверка промокода, введённого пользователем ===
router.get('/api/promos/:code', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const now = new Date();

  try {
    const { rows } = await pool.query(
      `SELECT discount_percent, single_use, expires_at, usage_count
          FROM promo_codes
         WHERE code = $1`,
      [code]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Промокод не найден' });

    const p = rows[0];

    if (p.expires_at && new Date(p.expires_at) < now)
      return res.status(410).json({ error: 'Промокод истёк' });

    if (p.single_use && p.usage_count > 0)
      return res.status(409).json({ error: 'Промокод уже использован' });

    // фронту хватит процента скидки
    res.json({ discount_percent: p.discount_percent });
  } catch (err) {
    console.error('Ошибка при проверке промокода:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Генерация нового промокода
router.post('/api/promos/generate', promoLimiter, async (req, res) => {
  const fp = getFP(req);
  const now = new Date();

  try {
    // Уже есть действующий код?
    const { rows: dupe } = await pool.query(
      `SELECT code, expires_at
         FROM promo_codes
        WHERE metadata->>'fp' = $1
          AND expires_at > $2
        LIMIT 1`,
      [fp, now]
    );
    if (dupe.length) {
      return res.status(409).json({
        error: 'quiz_already_taken',
        code: dupe[0].code,
        expires_at: dupe[0].expires_at.toISOString(),
      });
    }

    // Размер скидки
    const pct = Number.isInteger(req.body.discount_percent)
      ? Math.min(Math.max(req.body.discount_percent, 1), 100)
      : 10;

    // Генерация кода и срока
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(now.getTime() + 48 * 3600 * 1000);

    // Вставка в БД
    const { rows } = await pool.query(
      `INSERT INTO promo_codes
         (code, discount_percent, single_use, expires_at, metadata)
       VALUES
         ($1,      $2,              true,        $3,         $4)
       RETURNING code, discount_percent, expires_at`,
      [code, pct, expiresAt, JSON.stringify({ fp })]
    );

    const rec = rows[0];
    res.status(201).json({
      code: rec.code,
      discount_percent: rec.discount_percent,
      expires_at: rec.expires_at.toISOString(),
    });
  } catch (err) {
    console.error('Ошибка генерации промокода:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'collision' });
    }
    res.status(500).json({ error: 'Не удалось сгенерировать промокод' });
  }
});

module.exports = router;
