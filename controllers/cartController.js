const CartService = require('../services/cartService');

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private (User must be logged in)
const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        const userId = req.user.id; // ได้มาจาก protect middleware

        if (!bookId) {
            return res.status(400).json({ message: 'กรุณาระบุ bookId' });
        }

        const result = await CartService.addToCart(userId, bookId, quantity || 1);

        console.log("แก้ได้แล้ววววว", result);

        res.status(200).json(result);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตระกร้า' });
    }
};

module.exports = {
    addToCart
};
