// server/routes/products.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.PG_LINK,
});

// GET /api/products — получить список товаров с фильтрами
router.get('/api/products', async (req, res) => {
  try {
    const { category, search, ids } = req.query;
    const conditions = [];
    const values = [];

    if (ids) {
      const list = ids
        .split(',')
        .map((v) => parseInt(v, 10))
        .filter(Number.isInteger);
      if (list.length) {
        values.push(list);
        conditions.push(`p.id = ANY($${values.length})`);
      }
    }
    if (category && category !== 'Все') {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (search && search.trim()) {
      const tokens = search.trim().toLowerCase().split(/\s+/);
      tokens.forEach((tok) => {
        values.push(`%${tok}%`);
        conditions.push(`LOWER(p.title) LIKE $${values.length}`);
      });
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT
        p.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('size', ps.size, 'qty', ps.qty)
          ) FILTER (WHERE ps.size IS NOT NULL),
          '[]'
        ) AS stock
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      ${where}
      GROUP BY p.id
      ORDER BY p.sold_out DESC, p.id ASC
    `;

    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении списка товаров:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// GET /api/products/:id — получить товар по ID
router.get('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const sql = `
      SELECT
        p.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('size', ps.size, 'qty', ps.qty)
          ) FILTER (WHERE ps.size IS NOT NULL),
          '[]'
        ) AS stock
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    const { rows } = await pool.query(sql, [id]);
    if (!rows.length) {
      return res.status(404).send('Товар не найден');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Ошибка при получении товара ${id}:`, err);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;
