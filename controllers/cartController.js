/**
 * controllers/cartController.js — จัดการตะกร้าสินค้า
 *
 * ไฟล์นี้มี 1 Controller:
 *   1. addToCart — เพิ่มสินค้า (Variant) ลงในตะกร้าของผู้ใช้
 *
 * หมายเหตุ: ฟีเจอร์ Cart ยังอยู่ระหว่างพัฒนา
 * ปัจจุบัน Endpoint นี้ไม่ได้อยู่ใน API Spec หลัก (api.md)
 */

const CartService = require('../services/cartService');

/**
 * addToCart — เพิ่ม Variant ของหนังสือลงในตะกร้า
 *
 * @route  POST /api/cart/add
 * @access Private (ต้อง Login ก่อน)
 *
 * Request Body: { variantId, quantity }
 *   variantId  — ID ของ book_variants (ไม่ใช่ book ID)
 *   quantity   — จำนวนที่ต้องการเพิ่ม (default 1)
 *
 * ถ้า Variant นั้นอยู่ในตะกร้าแล้ว จะบวกจำนวนเพิ่ม
 * ถ้ายังไม่มี จะเพิ่มแถวใหม่ในตะกร้า
 */
const addToCart = async (req, res) => {
    try {
        const { variantId, quantity } = req.body;
        const userId = req.user.id; // ได้มาจาก protect middleware (อยู่ใน JWT Token)

        if (!variantId) {
            return res.status(400).json({ message: 'กรุณาระบุ variantId' });
        }

        const result = await CartService.addToCart(userId, variantId, quantity || 1);

        res.status(200).json(result);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า' });
    }
};

module.exports = { addToCart };
