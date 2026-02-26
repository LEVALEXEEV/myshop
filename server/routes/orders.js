// server/routes/orders.js
const express = require('express');
const { createPayment } = require('../utils/yookassa');
const { Pool } = require('pg');
const { notifyNewOrderPending, notifyOrderTelegramProvided } = require('./telegram');
const { markOrderPaid, cancelOrder } = require('../services/orders');

const SHIPPING_FEE = 449;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.PG_LINK,
});

// POST /api/orders/:id/status — обновление статуса заказа
// paid ─── приходит с фронта только после редиректа (fallback)
router.post('/api/orders/:id/status', async (req, res) => {
  if (req.body.status === 'paid') {
    try {
      await markOrderPaid(Number(req.params.id));
      return res.sendStatus(200);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ручная отмена (например, «Отменить» кнопкой на сайте)
  if (req.body.status === 'cancelled') {
    try {
      await cancelOrder(Number(req.params.id));
      return res.sendStatus(200);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.sendStatus(400);
});

// GET /api/orders/:id — посмотреть статус
router.get('/api/orders/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT status, total, telegram FROM orders WHERE id = $1',
    [Number(req.params.id)]
  );
  if (!rows.length) return res.sendStatus(404);
  res.json(rows[0]); // { status: 'pending'|'paid'|'canceled', total: 1510 }
});

router.patch('/api/orders/:id/telegram', async (req, res) => {
  const orderId = Number(req.params.id);
  const { telegram } = req.body || {};

  if (!orderId) return res.sendStatus(400);

  // простая валидация @username
  const re = /^@?[a-zA-Z0-9_]{5,32}$/;
  if (telegram && !re.test(telegram)) {
    return res.status(400).json({ error: 'Некорректный Telegram username' });
  }

  const norm = telegram ? telegram.replace(/^@/, '') : null;

  try {
    // возвращаем именно то, что записали
    const { rows } = await pool.query(
      `UPDATE orders
          SET telegram = $1
        WHERE id = $2
          AND status = 'paid'
          AND (telegram IS NULL OR telegram = '')
      RETURNING id, telegram`,
      [norm, orderId]
    );
    if (!rows.length) return res.sendStatus(404);

    // уведомляем бота только если реально записали непустой ник
    if (rows[0].telegram) {
      notifyOrderTelegramProvided({ id: rows[0].id, telegram: rows[0].telegram });
    }
    return res.sendStatus(204);
  } catch (e) {
    console.error('Update telegram error', e);
    return res.sendStatus(500);
  }
});

// ==== ОФОРМЛЕНИЕ ЗАКАЗА, ИНТЕГРАЦИЯ С ПЛАТЕЖКОЙ (НАЧАЛО) ====

// POST /api/orders — сохранить новый заказ
router.post('/api/orders', async (req, res) => {
  let {
    full_name,
    email,
    phone,
    shipping_method,
    address,
    coords,
    items,
    promo,
    agree_policy,
  } = req.body;

  // 0) Базовые валидации
  if (typeof full_name !== 'string' || !full_name.trim()) {
    return res.status(400).json({ error: 'Поле full_name обязательно' });
  }
  if (typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return res.status(400).json({ error: 'Неверный формат e-mail' });
  }
  if (typeof phone !== 'string' || phone.trim().length < 5) {
    return res.status(400).json({ error: 'Неверный формат телефона' });
  }

  const ALLOWED_SHIPPING = ['pickup', 'spb', 'rus', 'map'];
  if (!ALLOWED_SHIPPING.includes(shipping_method)) {
    return res.status(400).json({ error: 'Недоступный способ доставки' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Нужно указать хотя бы один товар' });
  }
  for (const it of items) {
    if (
      typeof it.id !== 'number' ||
      typeof it.selectedSize !== 'string' ||
      typeof it.quantity !== 'number' ||
      it.quantity <= 0
    ) {
      return res.status(400).json({ error: 'Некорректный объект в items' });
    }
  }

  if (agree_policy !== true) {
    return res.status(400).json({
      error: 'Нужно подтвердить согласие с политикой конфиденциальности',
    });
  }

  // 1) Валидация для "map"
  if (shipping_method === 'map') {
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Нужно указать адрес доставки' });
    }
    if (
      !Array.isArray(coords) ||
      coords.length !== 2 ||
      typeof coords[0] !== 'number' ||
      typeof coords[1] !== 'number' ||
      coords[0] < -90 ||
      coords[0] > 90 ||
      coords[1] < -180 ||
      coords[1] > 180
    ) {
      return res.status(400).json({
        error: 'Нужно указать корректные координаты в формате [lat, lng]',
      });
    }
    const [lat, lng] = coords;
    coords = { lat, lng };
  }

  // Нормализуем контакты
  const normEmail = email.trim().toLowerCase();
  const normPhone = phone.replace(/\D/g, '');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2) Проверяем использование промокода по e-mail или телефону
    if (promo) {
      const { rowCount } = await client.query(
        `SELECT 1
          FROM orders
          WHERE (LOWER(email) = $1 OR phone = $2)
            AND promo IS NOT NULL
            AND status = 'paid'
        LIMIT 1`,
        [normEmail, normPhone]
      );
      if (rowCount > 0) {
        throw {
          status: 400,
          message: 'На этот e-mail или телефон уже использовали промокод',
        };
      }
    }

    // 3) Считаем rawTotal
    let rawTotal = 0;
    const productNames = {};
    const productPrices = {};
    for (const { id, quantity } of items) {
      const { rows: prRows } = await client.query(
        'SELECT price, title AS name FROM products WHERE id = $1',
        [id]
      );
      if (!prRows.length) throw { status: 404, message: 'Товар не найден' };
      rawTotal += prRows[0].price * quantity;
      productNames[id] = prRows[0].name;
      productPrices[id] = prRows[0].price;
    }

    // 4) Обрабатываем промокод
    let finalTotal = rawTotal;
    if (promo) {
      const { rows } = await client.query(
        `SELECT discount_percent, single_use, expires_at, usage_count FROM promo_codes WHERE code = $1 FOR UPDATE`,
        [promo]
      );
      if (!rows.length) throw { status: 400, message: 'Промокод не найден' };
      const p = rows[0];
      if (p.expires_at && new Date(p.expires_at) < new Date())
        throw { status: 400, message: 'Промокод истёк' };
      if (p.single_use && p.usage_count > 0)
        throw { status: 400, message: 'Промокод уже использован' };

      finalTotal = Math.round((rawTotal * (100 - p.discount_percent)) / 100);
    }

    const grandTotal = finalTotal + SHIPPING_FEE;

    // 5) Сохраняем заказ
    const { rows: ordRows } = await client.query(
      `INSERT INTO orders
         (full_name, email, phone, shipping_method, address, coords, promo, items, total, agree_policy)
       VALUES
         ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10)
       RETURNING id, created_at`,
      [
        full_name,
        normEmail,
        normPhone,
        shipping_method,
        address || null,
        JSON.stringify(coords) || null,
        promo || null,
        JSON.stringify(items),
        grandTotal,
        agree_policy,
      ]
    );

    // 5.1) Составляем чек
    const coeff = finalTotal / rawTotal;

    // 1. Разворачиваем qty > 1, если понадобится «добросить» копейки
    const expanded = [];
    items.forEach((it) => {
      for (let i = 0; i < it.quantity; i++) {
        expanded.push({ ...it, quantity: 1 });
      }
    });

    // 2. Расчёт цен (unit price) — теперь quantity всегда = 1
    let kopLeft = finalTotal * 100;
    const itemsForReceipt = expanded.map((it, idx) => {
      let unitKop;

      if (idx === expanded.length - 1) {
        // отдаём последний остаток копеек
        unitKop = kopLeft;
      } else {
        unitKop = Math.round(productPrices[it.id] * 100 * coeff);
        if (unitKop > kopLeft) unitKop = kopLeft; // защита от переполнения
      }

      kopLeft -= unitKop;

      return {
        description: productNames[it.id],
        quantity: '1',
        amount: { value: (unitKop / 100).toFixed(2), currency: 'RUB' },
        vat_code: 1,
        payment_mode: 'full_payment',
        payment_subject: 'commodity',
      };
    });

    if (kopLeft !== 0) {
      // это крайне маловероятно; если случилось – откатываем
      throw new Error('Нельзя корректно распределить копейки по позициям');
    }

    itemsForReceipt.push({
      description: 'Доставка',
      quantity: '1',
      amount: { value: SHIPPING_FEE.toFixed(2), currency: 'RUB' },
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'service',
    });

    const receipt = {
      customer: { email: normEmail },
      tax_system_code: 1,
      items: itemsForReceipt,
    };

    await client.query('COMMIT');

    const payment = await createPayment({
      amount: grandTotal.toFixed(2),
      orderId: ordRows[0].id,
      returnUrl: `${process.env.FRONTEND_URL}/payment-result?order=${ordRows[0].id}`,
      description: `Заказ №${ordRows[0].id}`,
      receipt,
    });

    // 7) Уведомляем Telegram и возвращаем ответ
    const order = ordRows[0];
    // notifyNewOrderPending({
    //   id: order.id,
    //   created_at: order.created_at,
    //   full_name,
    //   email,
    //   phone,
    //   shipping_method,
    //   address,
    //   coords,
    //   grandTotal,
    //   items,
    //   status: 'pending',
    // });

    res.status(201).json({
      orderId: order.id,
      createdAt: order.created_at,
      total: grandTotal,
      confirmationUrl: payment.confirmation.confirmation_url,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при сохранении заказа:', err);
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    res.status(500).json({ error: 'Не удалось сохранить заказ' });
  } finally {
    client.release();
  }
});

// ==== ОФОРМЛЕНИЕ ЗАКАЗА, ИНТЕГРАЦИЯ С ПЛАТЕЖКОЙ (КОНЕЦ) ====

module.exports = router;
