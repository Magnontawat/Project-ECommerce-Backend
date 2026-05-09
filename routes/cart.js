const express = require('express');
const router  = express.Router();
const { addToCart, getCart, removeCartItem, updateCartItem } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',            protect, getCart);
router.post('/add',        protect, addToCart);
router.delete('/items/:id', protect, removeCartItem);
router.put('/items/:id',   protect, updateCartItem);

module.exports = router;
