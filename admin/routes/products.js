import express from 'express';
import csrf from 'csurf';

import pool from '../db.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { intOrNull, textOrNull, normalizeExtraImages } from '../utils/helpers.js';
import { getExtraImagesMode, buildExtraImagesSql, serializeExtraImages } from '../utils/extraImages.js';

const router = express.Router();
const csrfProtection = csrf();

router.get('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, price, category, image, sold_out FROM products ORDER BY id DESC'
  );
  res.render('products', {
    csrfToken: req.csrfToken(),
    products: rows,
  });
}));

router.get('/new', requireAuth, csrfProtection, (req, res) => {
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

router.post('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
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

  const mode = await getExtraImagesMode();
  const extraSql = buildExtraImagesSql(mode, 6);
  const extraVal = serializeExtraImages(mode, extra_images);

  const { rows } = await pool.query(
    `INSERT INTO products (title, price, category, image, image_hover, extra_images, description, size_chart, sold_out)
     VALUES ($1,$2,$3,$4,$5,${extraSql},$7,$8,$9)
     RETURNING id`,
    [title, price, category, image, image_hover, extraVal, description, size_chart, sold_out]
  );

  res.redirect(`/products/${rows[0].id}`);
}));

router.get('/:id', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
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

router.post('/:id', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
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

  const mode = await getExtraImagesMode();
  const extraSql = buildExtraImagesSql(mode, 6);
  const extraVal = serializeExtraImages(mode, extra_images);

  await pool.query(
    `UPDATE products
     SET title=$1, price=$2, category=$3, image=$4, image_hover=$5, extra_images=${extraSql}, description=$7, size_chart=$8, sold_out=$9
     WHERE id=$10`,
    [title, price, category, image, image_hover, extraVal, description, size_chart, sold_out, id]
  );

  res.redirect(`/products/${id}`);
}));

router.post('/:id/delete', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
  res.redirect('/products');
}));

export default router;
