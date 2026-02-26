// server/utils/yookassa.js
const { v4: uuidv4 } = require('uuid');
const YooKassa = require('yookassa');

const yooKassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

async function createPayment({
  amount,
  orderId,
  returnUrl,
  description,
  receipt,
}) {
  // amount — сумма в рублях *с копейками*, строкой
  const idempotenceKey = uuidv4();

  const payment = await yooKassa.createPayment(
    {
      amount: { value: amount, currency: 'RUB' },
      capture: true, // списываем сразу
      confirmation: {
        type: 'redirect', // или embedded, если нужен виджет
        return_url: returnUrl,
      },
      description,
      metadata: { order_id: orderId }, // чтобы в webhook знать, какой это заказ
      receipt,
    },
    idempotenceKey
  );

  return payment;
}

module.exports = { createPayment };
