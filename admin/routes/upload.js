import path from 'node:path';
import crypto from 'node:crypto';

import express from 'express';
import csrf from 'csurf';
import multer from 'multer';

import pool from '../db.js';
import { SHOP_IMAGES_DIR } from '../config.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { ensureDir, safeFolder, safeBaseName } from '../utils/helpers.js';
import { getExtraImagesMode } from '../utils/extraImages.js';

const router = express.Router();
const csrfProtection = csrf();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ALLOWED_FIELDS = new Set(['image', 'image_hover', 'size_chart', 'extra_images']);

router.post('/', requireAuth, upload.single('file'), csrfProtection, asyncHandler(async (req, res) => {
  const folder = safeFolder(req.body.folder);
  const baseName = safeBaseName(req.body.baseName);

  const file = req.file;
  if (!file) return res.status(400).send('No file');

  const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
  const suffix = crypto.randomBytes(6).toString('hex');
  const fileName = `${baseName}-${suffix}${ext}`;

  const destDir = path.resolve(process.cwd(), SHOP_IMAGES_DIR, folder);
  await ensureDir(destDir);
  await import('node:fs/promises').then((fs) => fs.writeFile(path.join(destDir, fileName), file.buffer));

  const publicPath = `/images/${folder}/${fileName}`;

  const productId = Number(req.body.productId);
  const field = (req.body.field || 'image').toString();

  if (Number.isFinite(productId) && ALLOWED_FIELDS.has(field)) {
    if (field === 'extra_images') {
      const mode = await getExtraImagesMode();
      if (mode === 'text_array') {
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

export default router;
