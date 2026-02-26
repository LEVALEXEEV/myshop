import express from 'express';
import csrf from 'csurf';

import pool from '../db.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { intOrNull } from '../utils/helpers.js';

const router = express.Router();
const csrfProtection = csrf();

router.get('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT code, discount_percent, single_use, expires_at, usage_count, created_at
       FROM promo_codes
      ORDER BY created_at DESC`
  );
  res.render('promos', { csrfToken: req.csrfToken(), promos: rows, editPromo: null, error: null });
}));

router.get('/new', requireAuth, csrfProtection, (req, res) => {
  res.render('promos', {
    csrfToken: req.csrfToken(),
    promos: [],
    editPromo: { code: '', discount_percent: 10, single_use: true, expires_at: '' },
    error: null,
  });
});

router.post('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const code = (req.body.code || '').toUpperCase().trim();
  const pct = intOrNull(req.body.discount_percent);
  const single_use = req.body.single_use === 'on';
  const expires_at = req.body.expires_at ? new Date(req.body.expires_at) : null;

  if (!code || pct === null || pct < 1 || pct > 100) {
    const { rows } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return res.status(400).render('promos', {
      csrfToken: req.csrfToken(),
      promos: rows,
      editPromo: { code, discount_percent: pct, single_use, expires_at: req.body.expires_at },
      error: 'Код обязателен, скидка от 1 до 100',
    });
  }

  try {
    await pool.query(
      `INSERT INTO promo_codes (code, discount_percent, single_use, expires_at, usage_count)
       VALUES ($1, $2, $3, $4, 0)`,
      [code, pct, single_use, expires_at]
    );
  } catch (e) {
    if (e.code === '23505') {
      const { rows } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
      return res.status(409).render('promos', {
        csrfToken: req.csrfToken(),
        promos: rows,
        editPromo: { code, discount_percent: pct, single_use, expires_at: req.body.expires_at },
        error: `Промокод «${code}» уже существует`,
      });
    }
    throw e;
  }

  res.redirect('/promos');
}));

router.get('/:code/edit', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const { rows: promos } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
  const promo = promos.find((p) => p.code === req.params.code.toUpperCase());
  if (!promo) return res.status(404).send('Not found');

  const expiresStr = promo.expires_at
    ? new Date(promo.expires_at).toISOString().slice(0, 16)
    : '';

  res.render('promos', {
    csrfToken: req.csrfToken(),
    promos,
    editPromo: { ...promo, expires_at: expiresStr },
    error: null,
  });
}));

router.post('/:code/edit', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const originalCode = req.params.code.toUpperCase();
  const pct = intOrNull(req.body.discount_percent);
  const single_use = req.body.single_use === 'on';
  const expires_at = req.body.expires_at ? new Date(req.body.expires_at) : null;

  if (pct === null || pct < 1 || pct > 100) {
    const { rows } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return res.status(400).render('promos', {
      csrfToken: req.csrfToken(),
      promos: rows,
      editPromo: { code: originalCode, discount_percent: pct, single_use, expires_at: req.body.expires_at },
      error: 'Скидка должна быть от 1 до 100',
    });
  }

  await pool.query(
    `UPDATE promo_codes
        SET discount_percent = $1,
            single_use       = $2,
            expires_at       = $3
      WHERE code = $4`,
    [pct, single_use, expires_at, originalCode]
  );

  res.redirect('/promos');
}));

router.post('/:code/delete', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM promo_codes WHERE code = $1', [req.params.code.toUpperCase()]);
  res.redirect('/promos');
}));

export default router;
