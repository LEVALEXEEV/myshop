import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export const PORT = Number(process.env.PORT || 8090);
export const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

export const PG_LINK = mustGetEnv('PG_LINK');
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD_HASH = mustGetEnv('ADMIN_PASSWORD_HASH');
export const SESSION_SECRET = mustGetEnv('SESSION_SECRET');
export const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';

export const SHOP_IMAGES_DIR = process.env.SHOP_IMAGES_DIR || '../server/images';
export const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
