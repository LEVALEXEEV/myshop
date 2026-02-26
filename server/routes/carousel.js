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
    const slidesMap = {};
    files.forEach((file) => {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      if (name.endsWith('_mobile')) {
        const base = name.slice(0, -7);
        slidesMap[base] = slidesMap[base] || {};
        slidesMap[base].mobile = `/images/carousel/${file}`;
      } else {
        slidesMap[name] = slidesMap[name] || {};
        slidesMap[name].desktop = `/images/carousel/${file}`;
      }
    });

    // Собрать в массив с гарантией наличия desktop/mobile
    const slides = Object.values(slidesMap).map(({ desktop, mobile }) => ({
      desktop: desktop || mobile,
      mobile: mobile || desktop,
    }));

    res.json(slides);
  });
});

module.exports = router;
