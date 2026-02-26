//--------------------------------------------------
//  Webhook ЮKassa с «мягкой» проверкой подписи
//  ─ если переменная YOOKASSA_WEBHOOK_SECRET не задана
//    — подпись пропускаем (пригодно для тестов / MVP)
//  ─ поддерживаем два события:
//      • payment.succeeded  → markOrderPaid()
//      • payment.canceled   → cancelOrder()
//--------------------------------------------------
const express = require('express');
const crypto = require('crypto');
const { markOrderPaid, cancelOrder } = require('../services/orders');

const SIGN_KEY = process.env.YOOKASSA_WEBHOOK_SECRET || ''; // пусто — нет проверки
const router = express.Router();

// ──────────────────────────────────────────────────────────────
// true  → подпись валидна или проверка отключена
// false → подпись не совпала / отсутствует, когда должна быть
function isSignatureOK(raw, headerValue) {
  if (!SIGN_KEY) return true; // проверка выключена
  if (!headerValue) return false; // ключ есть, подписи нет

  const mySign = crypto
    .createHmac('sha256', SIGN_KEY)
    .update(raw)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySign),
      Buffer.from(headerValue)
    );
  } catch {
    return false; // разная длина
  }
}

// ──────────────────────────────────────────────────────────────
router.post('/api/webhooks/yookassa', async (req, res) => {
  const rawBody = req.body; // Buffer (см. server.js!)
  const theirSign = req.headers['content-hmac-sha256'];

  // 1. Проверка подписи (если включена)
  if (!isSignatureOK(rawBody, theirSign)) {
    console.warn('[YK] bad signature, drop');
    return res.sendStatus(400);
  }

  // 2. Пытаемся распарсить JSON
  let note;
  try {
    note = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    console.error('[YK] invalid JSON', e);
    return res.sendStatus(400);
  }

  const { event, object } = note;
  const orderId = Number(object?.metadata?.order_id); // мы кладём id в metadata
  if (!orderId) {
    console.warn(`[YK] "${event}" without order_id, ignore`);
    return res.sendStatus(200);
  }

  // 3. Обрабатываем событие
  try {
    if (event === 'payment.succeeded') {
      await markOrderPaid(orderId);
    } else if (event === 'payment.canceled') {
      await cancelOrder(orderId);
    } else {
      console.log(`[YK] event "${event}" received, skipped`);
    }

    return res.sendStatus(200); // подтвердили приём
  } catch (e) {
    // идемпотентность: заказ уже в нужном статусе
    if (/duplicate key|не найден/i.test(e.message)) return res.sendStatus(200);

    console.error('[YK] handler error', e);
    return res.sendStatus(500);
  }
});

module.exports = router;
