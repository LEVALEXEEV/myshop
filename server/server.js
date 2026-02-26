// server/server.js
require('dotenv').config({ path: '.env' });          // базовые / прод
require('dotenv').config({ path: '.env.local', override: true }); // локальные переопределения
const express = require('express');
const cors = require('cors');
const path = require('path');
const yookassaWebhookRouter = require('./routes/yookassa-webhook');
const carouselRouter = require('./routes/carousel');
const supportersRouter = require('./routes/supporters');
const subscribeRouter = require('./routes/subscribe');
const promosRouter = require('./routes/promos');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const quizImagesRouter = require('./routes/quiz');
const { cancelExpiredPendingOrders } = require('./services/orders');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

app.use(cors());

app.use('/api/webhooks/yookassa', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json());

app.use(carouselRouter);
app.use(supportersRouter);
app.use(subscribeRouter);
app.use(promosRouter);
app.use(productsRouter);
app.use(ordersRouter);
app.use(yookassaWebhookRouter);
app.use(quizImagesRouter);

// Статическая раздача всех изображений
app.use(
  '/images',
  express.static(path.join(__dirname, 'images'), {
    acceptRanges: false,
  })
);

// === Отдача frontend (Vite React) ===
const frontendPath = path.join(__dirname, '../client/dist');
app.use(express.static(frontendPath));
app.get(/.*/, (_req, res) =>
  res.sendFile(path.join(frontendPath, 'index.html'))
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порт ${PORT}`);

  // каждые 60 с проверяем «протухшие» заказы
  setInterval(async () => {
    try {
      await cancelExpiredPendingOrders();
    } catch (e) {
      console.error('Ошибка авто-отмены заказов', e);
    }
  }, 60_000);
});
