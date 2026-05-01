const express = require('express');
const router = express.Router();
const { getBooks, getBookById } = require('../controllers/bookController');

// กำหนด Route สำหรับดึงข้อมูลหนังสือทั้งหมด
// เส้นทางที่เข้ามาที่นี่จะถูกต่อท้ายด้วย /api/books ตามที่กำหนดใน index.js
router.get('/', getBooks);
// กำหนด Route สำหรับดึงข้อมูลหนังสือตาม id
// เส้นทางที่เข้ามาที่นี่จะถูกต่อท้ายด้วย /api/books ตามที่กำหนดใน index.js
router.get('/:id', getBookById);

module.exports = router;
