/**
 * seed.js — ใส่ข้อมูลตัวอย่างลงฐานข้อมูล
 *
 * ใช้ Script นี้เพื่อรีเซ็ตข้อมูลทดสอบได้ทุกเมื่อ
 * โดยไม่ต้อง Import ไฟล์ SQL ด้วยตนเอง
 *
 * วิธีใช้งาน:
 *   node seed.js
 *
 * ⚠️  Script นี้จะลบข้อมูลเดิมทั้งหมดแล้วใส่ข้อมูลตัวอย่างใหม่
 *
 * หมายเหตุ: ต้องรัน database/init.sql เพื่อสร้างตารางก่อน
 *   mysql -u root -p < database/init.sql
 */

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
    let connection;

    try {
        connection = await mysql.createConnection({
            host:     process.env.DB_HOST,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ กำลังใส่ข้อมูลตัวอย่าง...');

        // ── ล้างข้อมูลเดิม (ตามลำดับ FK: ลูกก่อน แม่หลัง) ──────────────
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE cart_items');
        await connection.query('TRUNCATE TABLE carts');
        await connection.query('TRUNCATE TABLE book_variants');
        await connection.query('TRUNCATE TABLE books');
        await connection.query('TRUNCATE TABLE users');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🗑️  ล้างข้อมูลเดิมเรียบร้อย');

        // ── Seed: Users ──────────────────────────────────────────────────
        // รหัสผ่านของทุก account คือ: password123
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = [
            { username: 'admin', email: 'admin@example.com', password: hashedPassword, role: 'admin', level: 99 },
            { username: 'user1', email: 'user1@example.com', password: hashedPassword, role: 'user',  level: 1  },
        ];

        for (const user of users) {
            await connection.query(
                'INSERT INTO users (username, email, password, role, level) VALUES (?, ?, ?, ?, ?)',
                [user.username, user.email, user.password, user.role, user.level]
            );
        }
        console.log(`👤 เพิ่มข้อมูลผู้ใช้ตัวอย่าง ${users.length} คน`);

        // ── Seed: Books ──────────────────────────────────────────────────
        const books = [
            {
                title:           'The Weight of Ink',
                author:          'Rachel Kadish',
                publisher:       'Houghton Mifflin Harcourt',
                publish_year:    2017,
                genre:           'historical',
                synopsis:        'A sweeping historical narrative set in London of the 1660s and of the early twenty-first century.',
                cover_image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
            },
            {
                title:           'A Little Life',
                author:          'Hanya Yanagihara',
                publisher:       'Doubleday',
                publish_year:    2015,
                genre:           'literary',
                synopsis:        'A novel about the lives of four college friends navigating friendship, loss, and trauma in New York City.',
                cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
            },
            {
                title:           'Pachinko',
                author:          'Min Jin Lee',
                publisher:       'Grand Central Publishing',
                publish_year:    2017,
                genre:           'historical',
                synopsis:        'A multi-generational saga of a Korean family who eventually migrate to Japan, spanning nearly a century.',
                cover_image_url: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80',
            },
        ];

        for (const book of books) {
            await connection.query(
                `INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [book.title, book.author, book.publisher, book.publish_year, book.genre, book.synopsis, book.cover_image_url]
            );
        }
        console.log(`📚 เพิ่มข้อมูลหนังสือตัวอย่าง ${books.length} เล่ม`);

        // ── Seed: Book Variants ──────────────────────────────────────────
        // book_id จะตรงกับลำดับที่ INSERT books ด้านบน (1, 2, 3)
        const variants = [
            // The Weight of Ink (book_id 1)
            { book_id: 1, type: 'th',    price: 320.00, stock: 50  },
            { book_id: 1, type: 'en',    price: 450.00, stock: 30  },
            { book_id: 1, type: 'ebook', price: 149.00, stock: 999 },
            // A Little Life (book_id 2)
            { book_id: 2, type: 'th',    price: 280.00, stock: 40  },
            { book_id: 2, type: 'ebook', price: 129.00, stock: 999 },
            // Pachinko (book_id 3)
            { book_id: 3, type: 'th',    price: 299.00, stock: 35  },
            { book_id: 3, type: 'en',    price: 420.00, stock: 20  },
            { book_id: 3, type: 'ebook', price: 139.00, stock: 999 },
        ];

        for (const v of variants) {
            await connection.query(
                'INSERT INTO book_variants (book_id, type, price, stock) VALUES (?, ?, ?, ?)',
                [v.book_id, v.type, v.price, v.stock]
            );
        }
        console.log(`📦 เพิ่มข้อมูล variants ${variants.length} รายการ`);

        console.log('\n🎉 เสร็จสิ้น! ข้อมูลตัวอย่างพร้อมใช้งาน');
        console.log('   admin@example.com / password123 (role: admin)');
        console.log('   user1@example.com / password123 (role: user)');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit();
    }
};

seedData();
