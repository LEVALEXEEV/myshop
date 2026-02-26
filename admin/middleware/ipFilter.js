import { ADMIN_ALLOWED_IPS } from '../config.js';

export function ipFilter(req, res, next) {
  if (ADMIN_ALLOWED_IPS.length === 0) return next();
  if (ADMIN_ALLOWED_IPS.includes(req.ip)) return next();
  return res.status(403).send('Forbidden');
}
