const mysql = require('mysql2/promise');
require('dotenv').config();

// ฟังก์ชันสำหรับรัน Mock Data
const seedData = async () => {
    let connection;
    try {
        // สร้างการเชื่อมต่อแบบชั่วคราวสำหรับรันสคริปต์
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ กำลังเตรียมข้อมูล Mock Data...');

        // สร้างตาราง books ถ้ายังไม่มี
        await connection.query(`
            CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                cover TEXT,
                category VARCHAR(100),
                description TEXT
            )
        `);
        console.log('✅ ตรวจสอบและสร้างตาราง books เรียบร้อย');

        // ข้อมูลตัวอย่างที่คุณให้มา
        const mockBooks = [
            {
                title: "The Weight of Ink",
                author: "Rachel Kadish",
                price: 24.00,
                cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
                category: "Historical Fiction",
                description: "A sweeping historical narrative set in London of the 1660s and of the early twenty-first century."
            },
            {
                title: "A Little Life",
                author: "Hanya Yanagihara",
                price: 22.50,
                cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
                category: "Contemporary Fiction",
                description: "A novel about the lives of four college friends in New York City."
            },
            {
                title: "Pachinko",
                author: "Min Jin Lee",
                price: 19.00,
                cover: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=400&q=80",
                category: "Historical Fiction",
                description: "A multi-generational saga of a Korean family who eventually migrate to Japan."
            }
        ];

        // ทำการล้างข้อมูลเก่าในตาราง (ถ้าต้องการ) เพื่อไม่ให้ข้อมูลซ้ำ
        // await connection.query('TRUNCATE TABLE books');

        // วนลูปยัดข้อมูลลงในตาราง
        for (const book of mockBooks) {
            await connection.query(
                'INSERT INTO books (title, author, price, cover, category, description) VALUES (?, ?, ?, ?, ?, ?)',
                [book.title, book.author, book.price, book.cover, book.category, book.description]
            );
        }

        console.log(`🎉 เพิ่มข้อมูลหนังสือตัวอย่างสำเร็จจำนวน ${mockBooks.length} เล่ม!`);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        // ปิดการเชื่อมต่อเสมอไม่ว่าจะสำเร็จหรือเกิดข้อผิดพลาด
        if (connection) {
            await connection.end();
            console.log('🔒 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
        }
        process.exit();
    }
};

// รันฟังก์ชัน
seedData();
