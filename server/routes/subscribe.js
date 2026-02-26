// server/routes/subscribe.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// Настройка подключения к БД
const pool = new Pool({
  connectionString: process.env.PG_LINK,
});

// POST /api/subscribe — сохранить e-mail подписчика
router.post('/api/subscribe', async (req, res) => {
  const { email, agreed } = req.body;

  // 1) email обязательный
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email обязателен' });
  }

  // 2) согласие обязательно
  if (agreed !== true) {
    return res
      .status(400)
      .json({ error: 'Нужно подтвердить согласие на рассылку' });
  }

  const normalized = email.trim().toLowerCase();
  // простая валидация
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(normalized)) {
    return res.status(400).json({ error: 'Некорректный формат email' });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO subscribers (email, agreed)
         VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE SET agreed = EXCLUDED.agreed`,
      [normalized, agreed]
    );
    res.status(201).json({ message: 'Подписка сохранена' });
  } catch (err) {
    console.error('Ошибка при сохранении подписчика:', err);
    res.status(500).json({ error: 'Не удалось сохранить подписку' });
  } finally {
    client.release();
  }
});

module.exports = router;
