// server/routes/carousel.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Карусельные изображения
router.get('/api/carousel', (req, res) => {
  const dirPath = path.join(__dirname, '..', 'images', 'carousel');

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error('Ошибка при чтении изображений карусели:', err);
      return res.status(500).send('Ошибка при чтении изображений');
    }

    // Отсортировать для предсказуемого порядка
    files.sort();

    // Сгруппировать desktop/mobile
    const slidesMapMobile = [];
    const slidesMapDesktop = [];
    files.forEach((file) => {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      if (name.endsWith('_mobile')) {
        slidesMapMobile.push(`/images/carousel/${file}`);
      } else {
        slidesMapDesktop.push(`/images/carousel/${file}`);
      }
    });

    // Собрать в массив с гарантией наличия desktop/mobile
    const slides = {
      desktop: slidesMapDesktop,
      mobile: slidesMapMobile,
    };

    res.json(slides);
  });
});

module.exports = router;
