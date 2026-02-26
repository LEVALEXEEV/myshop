import fs from 'node:fs/promises';

export function normalizeExtraImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function intOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function textOrNull(value) {
  const s = (value ?? '').toString().trim();
  return s ? s : null;
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function safeFolder(value) {
  const folder = (value || 'products').toString().trim();
  const allowed = new Set(['products', 'size-charts']);
  return allowed.has(folder) ? folder : 'products';
}

export function safeBaseName(value) {
  return (value || 'upload')
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-');
}
