/**
 * services/cartService.js — Business Logic สำหรับตะกร้าสินค้า
 *
 * Service Layer คืออะไร?
 *   เป็น Layer ที่แยก Business Logic ออกจาก Controller
 *   ทำให้ Code อ่านง่ายขึ้น และสามารถนำ Logic กลับมาใช้ใหม่ได้
 *
 *   Controller → รับ Request, ส่ง Response
 *   Service    → ประมวลผล Business Logic, ติดต่อ Database
 *
 * หมายเหตุ: ฟีเจอร์ Cart ยังอยู่ระหว่างพัฒนา
 */

const db = require('../config/db');

class CartService {

    /**
     * getOrCreateCart — ดึงตะกร้าของ User หรือสร้างใหม่ถ้ายังไม่มี
     *
     * แต่ละ User มีตะกร้าได้เพียง 1 ใบ (UNIQUE constraint บน user_id)
     * ถ้าเป็น User ใหม่ที่ยังไม่เคยเพิ่มสินค้า จะสร้างตะกร้าให้อัตโนมัติ
     *
     * @param {number} userId - ID ของ User
     * @returns {Object} { id, user_id } — ข้อมูลตะกร้า
     */
    static async getOrCreateCart(userId) {
        // ค้นหาตะกร้าที่มีอยู่แล้วของ User คนนี้
        const [carts] = await db.query(
            'SELECT * FROM carts WHERE user_id = ?',
            [userId]
        );

        if (carts.length > 0) {
            return carts[0]; // พบตะกร้าที่มีอยู่แล้ว → คืนกลับเลย
        }

        // ยังไม่มีตะกร้า → สร้างใหม่
        const [result] = await db.query(
            'INSERT INTO carts (user_id) VALUES (?)',
            [userId]
        );

        return { id: result.insertId, user_id: userId };
    }

    /**
     * addToCart — เพิ่ม Variant ลงในตะกร้า
     *
     * Logic:
     *   - ถ้า Variant นี้อยู่ในตะกร้าแล้ว → บวกจำนวนเพิ่ม
     *   - ถ้ายังไม่มี → เพิ่มแถวใหม่
     *
     * @param {number} userId    - ID ของ User
     * @param {number} variantId - ID ของ book_variants (ไม่ใช่ book ID)
     * @param {number} quantity  - จำนวนที่ต้องการเพิ่ม
     * @returns {Object} ผลลัพธ์การเพิ่มสินค้า
     */
    static async addToCart(userId, variantId, quantity = 1) {
        // ── 1. ดึงหรือสร้างตะกร้าของ User ──
        const cart   = await this.getOrCreateCart(userId);
        const cartId = cart.id;

        // ── 2. ตรวจสอบว่า Variant นี้อยู่ในตะกร้าแล้วหรือไม่ ──
        const [existingItems] = await db.query(
            'SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?',
            [cartId, variantId]
        );

        if (existingItems.length > 0) {
            // ── 3a. มีอยู่แล้ว → บวกจำนวนเพิ่ม ──
            const newQuantity = existingItems[0].quantity + quantity;
            await db.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existingItems[0].id]
            );
            return {
                message:   'อัปเดตจำนวนสินค้าในตะกร้าเรียบร้อย',
                cartId,
                variantId,
                quantity:  newQuantity,
            };
        }

        // ── 3b. ยังไม่มี → เพิ่มแถวใหม่ ──
        await db.query(
            'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)',
            [cartId, variantId, quantity]
        );
        return {
            message:  'เพิ่มสินค้าลงตะกร้าเรียบร้อย',
            cartId,
            variantId,
            quantity,
        };
    }
}

module.exports = CartService;
