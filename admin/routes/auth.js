import express from 'express';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import bcrypt from 'bcryptjs';

import { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, PUBLIC_URL } from '../config.js';
import { asyncHandler } from '../middleware/auth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const csrfProtection = csrf();

router.get('/login', loginLimiter, csrfProtection, (req, res) => {
  res.render('login', {
    csrfToken: req.csrfToken(),
    publicUrl: PUBLIC_URL,
    error: null,
  });
});

router.post('/login', loginLimiter, csrfProtection, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const userOk = username === ADMIN_USERNAME;
  const passOk = typeof password === 'string' && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!userOk || !passOk) {
    return res.status(401).render('login', {
      csrfToken: req.csrfToken(),
      publicUrl: PUBLIC_URL,
      error: 'Неверный логин или пароль',
    });
  }

  req.session.user = { username: ADMIN_USERNAME };
  return res.redirect('/products');
}));

router.post('/logout', csrfProtection, (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

export default router;
