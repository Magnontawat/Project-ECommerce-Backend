/**
 * routes/orderRoutes.js
 *
 * Prefix: /api/orders (กำหนดใน index.js)
 *
 * POST /api/orders      — สร้าง order จาก cart ปัจจุบัน  (User)
 * GET  /api/orders      — ดึงประวัติ order ทั้งหมด        (User)
 * GET  /api/orders/:id  — ดึงรายละเอียด order ตาม ID      (User)
 */

const express = require('express');
const router  = express.Router();
const { createOrder, getOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',   protect, createOrder);
router.get('/',    protect, getOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
