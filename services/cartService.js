const db = require('../config/db');

class CartService {
    // ดึงตระกร้าสินค้าของ User (ถ้ายังไม่มีให้สร้างใหม่)
    static async getOrCreateCart(userId) {
        // ค้นหาตระกร้าที่มีอยู่แล้ว
        console.log("add cart userId", userId);
        const [carts] = await db.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
        console.log("add cart carts.length", carts.length);
        if (carts.length > 0) {
            return carts[0];
        }
        console.log("add cart userId", userId);
        // ถ้ายังไม่มี ให้สร้างตระกร้าใหม่

        const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]); /////ผิดตรงนี้

        console.log("เทสๆๆๆ5", result);
        return { id: result.insertId, user_id: userId };

    }

    // เพิ่มสินค้าลงในตระกร้า
    static async addToCart(userId, bookId, quantity = 1) {
        // 1. ดึงหรือสร้างตระกร้าของ User

        console.log("เทสๆๆๆ1", userId);
        const cart = await this.getOrCreateCart(userId);

        const cartId = cart.id;


        // 2. ตรวจสอบว่ามีหนังสือนี้นตระกร้าอยู่แล้วหรือไม่
        const [existingItems] = await db.query(
            'SELECT * FROM cart_items WHERE cart_id = ? AND book_id = ?',
            [cartId, bookId]
        );

        if (existingItems.length > 0) {
            // 3. ถ้ามีอยู่แล้ว ให้บวกจำนวน (Quantity) เพิ่ม
            const newQuantity = existingItems[0].quantity + quantity;
            await db.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existingItems[0].id]
            );
            return { message: 'อัปเดตจำนวนสินค้าในตระกร้าเรียบร้อย', cartId, bookId, quantity: newQuantity };
        } else {
            // 4. ถ้ายังไม่มี ให้เพิ่มแถวใหม่
            await db.query(
                'INSERT INTO cart_items (cart_id, book_id, quantity) VALUES (?, ?, ?)',
                [cartId, bookId, quantity]
            );
            return { message: 'เพิ่มสินค้าลงตระกร้าเรียบร้อย', cartId, bookId, quantity };
        }
    }
}

module.exports = CartService;
