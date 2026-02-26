import express from 'express';
import csrf from 'csurf';

import pool from '../db.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { intOrNull } from '../utils/helpers.js';

const router = express.Router({ mergeParams: true });
const csrfProtection = csrf();

// GET /products/:id/stock
router.get('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
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

// POST /products/:id/stock
router.post('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
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
      if (!size || qty === null || qty < 0) continue;
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

export default router;
