/**
 * services/cartService.js
 *
 * getOrCreateCart — ดึงตะกร้าของ User หรือสร้างใหม่ถ้ายังไม่มี
 * addToCart       — เพิ่ม Variant ลงตะกร้า (ถ้ามีอยู่แล้ว → บวกจำนวน)
 */

const db = require('../config/db');

class CartService {

    /**
     * ดึงตะกร้าของ User หรือสร้างใหม่ถ้ายังไม่มี
     * แต่ละ User มีตะกร้าได้เพียง 1 ใบ (UNIQUE constraint บน user_id)
     *
     * @param {number} userId
     * @returns {{ id: number, user_id: number }}
     */
    static async getOrCreateCart(userId) {
        const [carts] = await db.query('SELECT * FROM carts WHERE user_id = ?', [userId]);

        if (carts.length > 0) return carts[0];

        const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
        return { id: result.insertId, user_id: userId };
    }

    /**
     * เพิ่ม Variant ลงตะกร้า
     * ถ้า Variant นี้อยู่ในตะกร้าแล้ว → บวกจำนวนเพิ่ม (ไม่สร้างแถวใหม่)
     *
     * @param {number} userId
     * @param {number} variantId  — ID ของ book_variants (ไม่ใช่ book ID)
     * @param {number} quantity
     */
    static async addToCart(userId, variantId, quantity = 1) {
        const cart   = await this.getOrCreateCart(userId);
        const cartId = cart.id;

        const [existingItems] = await db.query(
            'SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?',
            [cartId, variantId]
        );

        if (existingItems.length > 0) {
            const newQuantity = existingItems[0].quantity + quantity;
            await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existingItems[0].id]);
            return { message: 'อัปเดตจำนวนสินค้าในตะกร้าเรียบร้อย', cartId, variantId, quantity: newQuantity };
        }

        await db.query(
            'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)',
            [cartId, variantId, quantity]
        );
        return { message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อย', cartId, variantId, quantity };
    }
}

module.exports = CartService;
