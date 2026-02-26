// server/routes/quiz.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Раздаём статику из server/images/quiz по пути /api/quiz/images
router.use(
  '/api/quiz/images',
  express.static(path.join(__dirname, '../images/quiz'), {
    maxAge: '1d',
    immutable: true,
  })
);

module.exports = router;
