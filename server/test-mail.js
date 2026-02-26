// test-mail.js
const nodemailer = require('nodemailer');

async function sendTest() {
  let transporter = nodemailer.createTransport({
    host: 'smtp.timeweb.ru',
    port: 465,
    secure: true,
    auth: {
      user: 'inbox@resego.ru',
      pass: '^*Z$/g@a{_w4-s',
    },
    connectionTimeout: 10000,
  });

  await transporter.verify();
  console.log('✓ SMTP OK');

  let info = await transporter.sendMail({
    from: '"Магазин" <inbox@resego.ru>',
    to: 'resegooff@gmail.com', 
    subject: 'Тест SMTP Timeweb',
    text: 'Проверка отправки через Timeweb Cloud',
  });
  console.log('✓ Письмо отправлено:', info.messageId);
}

sendTest().catch(console.error);
