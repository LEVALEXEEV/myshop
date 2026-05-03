import express from 'express';
import csrf from 'csurf';

import pool from '../db.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { intOrNull } from '../utils/helpers.js';

const router = express.Router({ mergeParams: true });
const csrfProtection = csrf();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// GET /products/:id/stock
router.get('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const productRes = await pool.query(
    'SELECT id, title, variant_type FROM products WHERE id = $1',
    [id]
  );
  const product = productRes.rows[0];
  if (!product) return res.status(404).send('Not found');

  const variantType = product.variant_type || 'size';
  const stockRes = await pool.query(
    `SELECT size, color, color_hex, qty FROM product_stock
     WHERE product_id = $1
     ORDER BY size ASC, color ASC`,
    [id]
  );

  res.render('stock', {
    csrfToken: req.csrfToken(),
    product: { ...product, variant_type: variantType },
    stock: stockRes.rows,
    variantType,
  });
}));

// POST /products/:id/stock
router.post('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const { rows: prodRows } = await pool.query(
    'SELECT variant_type FROM products WHERE id = $1',
    [id]
  );
  if (!prodRows.length) return res.status(404).send('Not found');
  const variantType = prodRows[0].variant_type === 'color' ? 'color' : 'size';

  const qtys = Array.isArray(req.body.qty)
    ? req.body.qty
    : req.body.qty
    ? [req.body.qty]
    : [];

  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM product_stock WHERE product_id = $1', [id]);

    if (variantType === 'color') {
      const colorsRaw = req.body.color;
      const hexRaw = req.body.color_hex;
      const colors = Array.isArray(colorsRaw) ? colorsRaw : colorsRaw ? [colorsRaw] : [];
      const hexes = Array.isArray(hexRaw) ? hexRaw : hexRaw ? [hexRaw] : [];

      for (let i = 0; i < colors.length; i++) {
        const name = (colors[i] || '').toString().trim();
        const qty = intOrNull(qtys[i]);
        let hex = (hexes[i] || '').toString().trim().toLowerCase();
        if (!name || qty === null || qty < 0) continue;
        if (!HEX_RE.test(hex)) hex = '#000000';

        await pool.query(
          `INSERT INTO product_stock (product_id, size, color, color_hex, qty)
           VALUES ($1, '', $2, $3, $4)`,
          [id, name, hex, qty]
        );
      }
    } else {
      const sizesRaw = req.body.size;
      const sizes = Array.isArray(sizesRaw) ? sizesRaw : sizesRaw ? [sizesRaw] : [];

      for (let i = 0; i < sizes.length; i++) {
        const size = (sizes[i] || '').toString().trim();
        const qty = intOrNull(qtys[i]);
        if (!size || qty === null || qty < 0) continue;
        await pool.query(
          `INSERT INTO product_stock (product_id, size, color, color_hex, qty)
           VALUES ($1, $2, '', '', $3)`,
          [id, size, qty]
        );
      }
    }

    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }

  res.redirect(`/products/${id}/stock`);
}));

export default router;
