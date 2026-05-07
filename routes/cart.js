/**
 * routes/cart.js — เส้นทาง API สำหรับตะกร้าสินค้า
 *
 * Prefix: /api/cart (กำหนดใน index.js)
 *
 * Endpoints:
 *   POST /api/cart/add — เพิ่มสินค้าลงตะกร้า (ต้อง Login)
 *
 * หมายเหตุ: ฟีเจอร์ Cart ยังอยู่ระหว่างพัฒนา
 */

const express  = require('express');
const router   = express.Router();
const { addToCart } = require('../controllers/cartController');
const { protect }   = require('../middleware/authMiddleware');

// POST /api/cart/add — ทุกคนต้อง Login ก่อน (protect middleware)
router.post('/add', protect, addToCart);

module.exports = router;
