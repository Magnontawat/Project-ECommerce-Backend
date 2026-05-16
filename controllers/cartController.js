/**
 * controllers/cartController.js
 *
 * addToCart      — เพิ่มสินค้าลงตะกร้า         (POST /api/cart/add)
 * getCart        — ดึงข้อมูลตะกร้า              (GET  /api/cart)
 * removeCartItem — ลบสินค้าออกจากตะกร้า        (DELETE /api/cart/items/:id)
 * updateCartItem — แก้ไขจำนวนสินค้าในตะกร้า    (PUT /api/cart/items/:id)
 */

const db          = require('../config/db');
const CartService = require('../services/cartService');

// ─── Add to Cart ──────────────────────────────────────────────────────────────

/**
 * @route  POST /api/cart/add
 * @access User
 */
const addToCart = async (req, res) => {
    const { variantId, quantity } = req.body;
    const userId = req.user.id;

    if (!variantId) {
        return res.status(400).json({ message: 'กรุณาระบุ variantId' });
    }

    try {
        const result = await CartService.addToCart({ userId, variantId, quantity: quantity || 1 });
        res.status(200).json(result);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า' });
    }
};

// ─── Get Cart ─────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/cart
 * @access User
 */
const getCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const [cart] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            return res.status(200).json({ cartId: null, items: [] });
        }

        const cartId = cart[0].id;
        const [items] = await db.query(
            `SELECT ci.id AS cartItemId, ci.quantity,
                    bv.id AS variantId, bv.type, bv.price, bv.stock,
                    b.id  AS bookId, b.title, b.author, b.cover_image_url
             FROM cart_items ci
             JOIN book_variants bv ON bv.id = ci.variant_id
             JOIN books b          ON b.id  = bv.book_id
             WHERE ci.cart_id = ?`,
            [cartId]
        );

        res.status(200).json({
            cartId,
            items: items.map((row) => ({
                cartItemId: row.cartItemId,
                quantity:   row.quantity,
                variant: { id: row.variantId, type: row.type, price: row.price, stock: row.stock },
                book:    { id: row.bookId, title: row.title, author: row.author, cover_image_url: row.cover_image_url },
            })),
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า' });
    }
};

// ─── Remove Cart Item ─────────────────────────────────────────────────────────

/**
 * @route  DELETE /api/cart/items/:id
 * @access User
 */
const removeCartItem = async (req, res) => {
    const userId = req.user.id;
    const itemId = req.params.id;

    try {
        // ตรวจว่า cart item นี้เป็นของ user ที่ส่ง request มาจริง
        const [rows] = await db.query(
            `SELECT ci.id FROM cart_items ci
             JOIN carts c ON c.id = ci.cart_id
             WHERE ci.id = ? AND c.user_id = ?`,
            [itemId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรายการสินค้าในตะกร้า' });
        }

        await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
        res.status(200).json({ message: 'ลบสินค้าออกจากตะกร้าเรียบร้อย' });
    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสินค้าออกจากตะกร้า' });
    }
};

// ─── Update Cart Item Quantity ────────────────────────────────────────────────

/**
 * @route  PUT /api/cart/items/:id
 * @access User
 * @body   { quantity: number }
 */
const updateCartItem = async (req, res) => {
    const userId   = req.user.id;
    const itemId   = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
        return res.status(400).json({ message: 'กรุณาระบุจำนวนที่ถูกต้อง' });
    }

    try {
        // ตรวจว่า cart item นี้เป็นของ user ที่ส่ง request มาจริง
        const [rows] = await db.query(
            `SELECT ci.id FROM cart_items ci
             JOIN carts c ON c.id = ci.cart_id
             WHERE ci.id = ? AND c.user_id = ?`,
            [itemId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรายการสินค้าในตะกร้า' });
        }

        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
        res.status(200).json({
            message:    'อัปเดตจำนวนสินค้าเรียบร้อย',
            cartItemId: Number(itemId),
            quantity:   Number(quantity),
        });
    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขจำนวนสินค้า' });
    }
};

module.exports = { addToCart, getCart, removeCartItem, updateCartItem };
