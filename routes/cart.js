const express = require('express');
const router = express.Router();
const { addToCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/cart/add
// ทุกคนต้อง Login ก่อนถึงจะใช้ API เส้นนี้ได้ (Require Auth)
router.post('/add', protect, addToCart);

module.exports = router;
