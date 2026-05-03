// server/routes/telegram.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

// Подключение к БД (для getItemsDetails)
const pool = new Pool({
  connectionString: process.env.PG_LINK,
});

// Получить детали товаров для уведомлений
async function getItemsDetails(items) {
  const ids = items.map((it) => it.id);
  const { rows } = await pool.query(
    `SELECT id, title FROM products WHERE id = ANY($1)`,
    [ids]
  );
  const mapTitle = Object.fromEntries(rows.map((r) => [r.id, r.title]));
  return items.map((it) => {
    const title = mapTitle[it.id] || `#${it.id}`;
    const variantLabel = it.selectedColor
      ? `цвет ${it.selectedColor}`
      : `размер ${it.selectedSize}`;
    return `• ${title} ×${it.quantity} (${variantLabel})`;
  });
}

// Уведомление о новом заказе
async function notifyOrder(orderData) {
  if (!isTelegramEnabled || !bot) return;
  const {
    id,
    created_at,
    full_name,
    email,
    phone,
    shipping_method,
    address,
    coords,
    grandTotal,
    items,
    telegram,
    status = 'pending',
  } = orderData;

  const lines = await getItemsDetails(items);
  const coordsText = coords?.lat
    ? `*Координаты:* \`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}\``
    : '';
  const shippingText =
    shipping_method === 'map'
      ? '📦 Доставка: СДЭК'
      : `📦 Доставка: ${shipping_method}`;

  const header =
    status === 'paid'
      ? `💸 *Заказ #${id} оплачен*`
      : status === 'cancelled'
      ? `❌ *Заказ #${id} отменён*`
      : `💼 *Новый заказ #${id}*`;

  const msg = [
    header,
    `👤 ФИО: ${full_name}`,
    `📩 E-mail: ${email}`,
    `📱 Телефон: ${phone}`,
    telegram ? `👾 Telegram: @${telegram}` : '',
    shippingText,
    address ? `*Адрес:* \`${address}\`` : '',
    coordsText,
    '\n*Состав заказа:*',
    ...lines,
    `\n💵 Сумма: ${grandTotal.toLocaleString()} ₽`,
    `⏳ Время: ${new Date(created_at).toLocaleString()}`,
    `🚩 Статус: ${
      status === 'paid'
        ? 'Оплачен'
        : status === 'cancelled'
        ? 'Отменён'
        : 'Ожидает оплату'
    }`,
  ]
    .filter(Boolean)
    .join('\n');

  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg, {
    parse_mode: 'Markdown',
    reply_markup:
      status === 'paid'
        ? {
            // кнопка «Завершить» только когда оплачен
            inline_keyboard: [
              [{ text: '✅ Завершить', callback_data: `complete_${id}` }],
            ],
          }
        : undefined,
  });
}

async function notifyOrderTelegramProvided({ id, telegram }) {
  if (!isTelegramEnabled || !bot) return;
  const text = `✏️ Заказ #${id}: пользователь указал Telegram @${telegram}`;
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, text);
}

// алиасы для читаемости
// function notifyNewOrderPending(data) {
  // return notifyOrder({ ...data, status: 'pending' });
// }
function notifyOrderPaid(data) {
  return notifyOrder({ ...data, status: 'paid' });
}

// function notifyOrderCancelled(data) {
  // return notifyOrder({ ...data, status: 'cancelled' });
// }

// Инициализация бота
const isTelegramEnabled = process.env.TELEGRAM_ENABLED === 'true';
let bot = null;
if (isTelegramEnabled) {
  bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, `Ваш chat_id: ${msg.chat.id}`);
  });

  bot.on('callback_query', async (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const msgId = query.message.message_id;

    if (data.startsWith('complete_')) {
      await bot.editMessageReplyMarkup(
        {
          inline_keyboard: [
            [
              {
                text: '✅ Подтвердить',
                callback_data: data.replace('complete', 'confirm'),
              },
              {
                text: '❌ Отмена',
                callback_data: data.replace('complete', 'cancel'),
              },
            ],
          ],
        },
        { chat_id: chatId, message_id: msgId }
      );
      return bot.answerCallbackQuery(query.id);
    }

    if (data.startsWith('confirm_')) {
      const orderId = +data.split('_')[1];
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [
        'completed',
        orderId,
      ]);
      await bot.editMessageText(
        query.message.text.replace(/🚩 Статус: .+$/, '🚩 Статус: Завершён'),
        {
          chat_id: chatId,
          message_id: msgId,
          parse_mode: 'Markdown',
        }
      );
      return bot.answerCallbackQuery(query.id, {
        text: `Заказ #${orderId} завершён`,
      });
    }

    if (data.startsWith('cancel_')) {
      const orderId = +data.split('_')[1];
      await bot.editMessageReplyMarkup(
        {
          inline_keyboard: [
            [{ text: '✅ Завершить', callback_data: `complete_${orderId}` }],
          ],
        },
        { chat_id: chatId, message_id: msgId }
      );
      return bot.answerCallbackQuery(query.id, { text: 'Отмена' });
    }
  });
}

module.exports = {
  // notifyNewOrderPending,
  notifyOrderPaid,
  // notifyOrderCancelled,
  notifyOrderTelegramProvided,
};
