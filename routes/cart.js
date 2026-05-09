/**
 * routes/cart.js
 *
 * Prefix: /api/cart (กำหนดใน index.js)
 *
 * GET    /api/cart            — ดึงตะกร้าสินค้า        (User)
 * POST   /api/cart/add        — เพิ่มสินค้าลงตะกร้า    (User)
 * DELETE /api/cart/items/:id  — ลบสินค้าออกจากตะกร้า   (User)
 * PUT    /api/cart/items/:id  — แก้ไขจำนวนสินค้า       (User)
 */

const express = require('express');
const router  = express.Router();
const { addToCart, getCart, removeCartItem, updateCartItem } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',             protect, getCart);
router.post('/add',         protect, addToCart);
router.delete('/items/:id', protect, removeCartItem);
router.put('/items/:id',    protect, updateCartItem);

module.exports = router;
