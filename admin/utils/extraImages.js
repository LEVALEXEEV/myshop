import pool from '../db.js';

let cachedMode = null;

// returns: 'text_array' | 'jsonb'
export async function getExtraImagesMode() {
  if (cachedMode) return cachedMode;

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

    if (!rows.length) {
      cachedMode = 'jsonb';
      return cachedMode;
    }

    const { data_type, udt_name } = rows[0];

    if (data_type === 'ARRAY' && udt_name === '_text') {
      cachedMode = 'text_array';
    } else if (data_type === 'jsonb' || udt_name === 'jsonb') {
      cachedMode = 'jsonb';
    } else {
      cachedMode = 'jsonb';
    }
  } catch (e) {
    console.warn('[admin] could not detect extra_images type, defaulting to jsonb', e);
    cachedMode = 'jsonb';
  }

  return cachedMode;
}

export function buildExtraImagesSql(mode, paramIndex) {
  return mode === 'text_array' ? `$${paramIndex}::text[]` : `$${paramIndex}::jsonb`;
}

export function serializeExtraImages(mode, images) {
  return mode === 'text_array' ? images : JSON.stringify(images);
}
