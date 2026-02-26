// server/routes/supporters.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Изображения поддерживающих
router.get('/api/supporters', (req, res) => {
  const dirPath = path.join(__dirname, '..', 'images', 'supporters');

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error('Ошибка при чтении изображений supporters:', err);
      return res.status(500).send('Ошибка при чтении изображений');
    }

    // Сортируем для предсказуемого порядка
    const sortedFiles = files.sort();
    const urls = sortedFiles.map((file) => `/images/supporters/${file}`);

    res.json(urls);
  });
});

module.exports = router;
