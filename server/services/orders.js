// server/services/orders.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.PG_LINK });
const { notifyOrderPaid, notifyOrderCancelled } = require('../routes/telegram');

async function markOrderPaid(orderId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT items, promo
         FROM orders
        WHERE id = $1
        FOR UPDATE`,
      [orderId]
    );
    if (!rows.length) throw new Error('Заказ не найден');
    const { items, promo } = rows[0];

    for (const { id: productId, selectedSize: size, quantity } of items) {
      const { rows: st } = await client.query(
        'SELECT qty FROM product_stock WHERE product_id = $1 AND size = $2 FOR UPDATE',
        [productId, size]
      );
      const avail = st.length ? st[0].qty : 0;
      if (avail < quantity)
        throw new Error(
          `Недостаточно товара ${productId}/${size}, доступно ${avail}`
        );

      await client.query(
        'UPDATE product_stock SET qty = qty - $3 WHERE product_id = $1 AND size = $2',
        [productId, size, quantity]
      );
    }

    await client.query('UPDATE orders SET status = $1 WHERE id = $2', [
      'paid',
      orderId,
    ]);

    // ── теперь «сжигаем» одноразовый промокод, если он был ──
    if (promo) {
      await client.query(
        `UPDATE promo_codes
            SET usage_count = usage_count + 1
          WHERE code = $1`,
        [promo]
      );
    }

    await client.query('COMMIT');

    // ─── после подтверждения оплаты уведомляем Телеграм ───
    const {
      rows: [order],
    } = await pool.query(
      `SELECT id, created_at, full_name, email, phone,
            shipping_method, address, coords, items,
            total AS "grandTotal", telegram
       FROM orders WHERE id = $1`,
      [orderId]
    );

    notifyOrderPaid({ ...order, status: 'paid' });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function cancelOrder(orderId) {
  // Меняем статус и сразу же возвращаем данные для TG
  const { rows } = await pool.query(
    `UPDATE orders
        SET status = 'cancelled'
      WHERE id = $1 AND status = 'pending'
   RETURNING id, created_at, full_name, email, phone,
             shipping_method, address, coords, items,
             total AS "grandTotal"`,
    [orderId]
  );

  // if (rows.length) {
  //   notifyOrderCancelled({ ...rows[0], status: 'cancelled' });
  // }
}

// Авто-отмена всех pending-заказов старше 15 минут. Возвращает массив id отменённых заказов.
async function cancelExpiredPendingOrders() {
  const { rows } = await pool.query(
    `UPDATE orders
         SET status = 'cancelled'
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '15 minutes'
     RETURNING id`
  );

  // опционально: уведомляем Telegram
  // if (rows.length) {
  //   for (const { id } of rows) {
  //     const {
  //       rows: [order],
  //     } = await pool.query(
  //       `SELECT id, created_at, full_name, email, phone,
  //               shipping_method, address, coords, items,
  //               total AS "grandTotal"
  //          FROM orders WHERE id = $1`,
  //       [id]
  //     );
  //     notifyOrderCancelled(order);
  //   }
  // }
  return rows.map((r) => r.id);
}

module.exports = {
  markOrderPaid,
  cancelOrder,
  cancelExpiredPendingOrders,
};
