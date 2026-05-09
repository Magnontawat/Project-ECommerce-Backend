const db = require('../config/db');

const createOrder = async (req, res) => {
    const userId = req.user.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // ดึง cart items พร้อมราคา variant ปัจจุบัน
        const [cart] = await conn.query(
            'SELECT id FROM carts WHERE user_id = ?',
            [userId]
        );
        if (cart.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'ตะกร้าของคุณว่างเปล่า' });
        }
        const cartId = cart[0].id;

        const [items] = await conn.query(
            `SELECT ci.id AS cartItemId, ci.quantity,
                    bv.id AS variantId, bv.type, bv.price,
                    b.id AS bookId, b.title, b.author, b.cover_image_url
             FROM cart_items ci
             JOIN book_variants bv ON bv.id = ci.variant_id
             JOIN books b ON b.id = bv.book_id
             WHERE ci.cart_id = ?`,
            [cartId]
        );

        if (items.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'ตะกร้าของคุณว่างเปล่า' });
        }

        const totalPrice = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

        const [orderResult] = await conn.query(
            'INSERT INTO orders (user_id, status, total_price) VALUES (?, "pending", ?)',
            [userId, totalPrice]
        );
        const orderId = orderResult.insertId;

        const orderItemRows = items.map((item) => [orderId, item.variantId, item.quantity, item.price]);
        await conn.query(
            'INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase) VALUES ?',
            [orderItemRows]
        );

        // ล้าง cart items หลัง checkout สำเร็จ
        await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

        await conn.commit();

        const [newOrderItems] = await conn.query(
            `SELECT oi.id, oi.quantity, oi.price_at_purchase,
                    bv.id AS variantId, bv.type,
                    b.id AS bookId, b.title, b.author, b.cover_image_url
             FROM order_items oi
             JOIN book_variants bv ON bv.id = oi.variant_id
             JOIN books b ON b.id = bv.book_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const [order] = await conn.query(
            'SELECT id, status, total_price, created_at FROM orders WHERE id = ?',
            [orderId]
        );

        res.status(201).json({
            message: 'สั่งซื้อสำเร็จ',
            order: {
                ...order[0],
                items: newOrderItems.map((oi) => ({
                    id: oi.id,
                    quantity: oi.quantity,
                    price_at_purchase: oi.price_at_purchase,
                    variant: { id: oi.variantId, type: oi.type },
                    book: { id: oi.bookId, title: oi.title, author: oi.author, cover_image_url: oi.cover_image_url },
                })),
            },
        });

    } catch (error) {
        await conn.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสั่งซื้อ' });
    } finally {
        conn.release();
    }
};

const getOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const [orders] = await db.query(
            `SELECT o.id, o.status, o.total_price, o.created_at,
                    COUNT(oi.id) AS item_count
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
        res.status(200).json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติคำสั่งซื้อ' });
    }
};

const getOrderById = async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    try {
        const [orders] = await db.query(
            'SELECT id, status, total_price, created_at FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );
        if (orders.length === 0) {
            return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
        }

        const [items] = await db.query(
            `SELECT oi.id, oi.quantity, oi.price_at_purchase,
                    bv.id AS variantId, bv.type,
                    b.id AS bookId, b.title, b.author, b.cover_image_url
             FROM order_items oi
             JOIN book_variants bv ON bv.id = oi.variant_id
             JOIN books b ON b.id = bv.book_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        res.status(200).json({
            ...orders[0],
            items: items.map((oi) => ({
                id: oi.id,
                quantity: oi.quantity,
                price_at_purchase: oi.price_at_purchase,
                variant: { id: oi.variantId, type: oi.type },
                book: { id: oi.bookId, title: oi.title, author: oi.author, cover_image_url: oi.cover_image_url },
            })),
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายละเอียดคำสั่งซื้อ' });
    }
};

module.exports = { createOrder, getOrders, getOrderById };
