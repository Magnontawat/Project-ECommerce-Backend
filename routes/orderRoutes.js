/**
 * routes/orderRoutes.js
 *
 * Prefix: /api/orders (กำหนดใน index.js)
 *
 * POST /api/orders              — สร้าง order จาก cart ปัจจุบัน  (User)
 * GET  /api/orders              — ดึงประวัติ order ของตัวเอง      (User)
 * GET  /api/orders/:id          — ดึงรายละเอียด order ตาม ID      (User)
 * GET  /api/orders/admin        — ดึง order ทั้งหมดในระบบ         (Admin)
 * PUT  /api/orders/admin/:id/status — อัปเดต status ของ order     (Admin)
 *
 * หมายเหตุ: Admin routes ต้องอยู่ก่อน /:id เพื่อป้องกัน "admin" ถูก match เป็น :id
 */

const express = require('express');
const router  = express.Router();
const { createOrder, getOrders, getOrderById, adminGetOrders, adminUpdateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin routes — ต้องนำหน้า /:id เสมอ
router.get('/admin',            protect, adminOnly, adminGetOrders);
router.put('/admin/:id/status', protect, adminOnly, adminUpdateOrderStatus);

// User routes
router.post('/',   protect, createOrder);
router.get('/',    protect, getOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
