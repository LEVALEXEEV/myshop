import { ADMIN_USERNAME } from '../config.js';

export function requireAuth(req, res, next) {
  if (req.session?.user?.username === ADMIN_USERNAME) return next();
  return res.redirect('/login');
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
