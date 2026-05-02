const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ฟังก์ชันสำหรับรัน Mock Data
const seedData = async () => {
    let connection;
    try {
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

        // สร้างตาราง users ถ้ายังไม่มี
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('buyer', 'admin') DEFAULT 'buyer',
                level INT DEFAULT 1
            )
        `);
        console.log('✅ ตรวจสอบและสร้างตาราง users เรียบร้อย');

        // ล้างข้อมูลเก่า
        await connection.query('TRUNCATE TABLE books');
        await connection.query('TRUNCATE TABLE users');

        // ข้อมูลตัวอย่าง books
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

        for (const book of mockBooks) {
            await connection.query(
                'INSERT INTO books (title, author, price, cover, category, description) VALUES (?, ?, ?, ?, ?, ?)',
                [book.title, book.author, book.price, book.cover, book.category, book.description]
            );
        }
        console.log(`🎉 เพิ่มข้อมูลหนังสือตัวอย่างสำเร็จจำนวน ${mockBooks.length} เล่ม!`);

        // ข้อมูลตัวอย่าง users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const mockUsers = [
            { username: 'admin', password: hashedPassword, role: 'admin', level: 99 },
            { username: 'buyer1', password: hashedPassword, role: 'buyer', level: 1 }
        ];

        for (const user of mockUsers) {
            await connection.query(
                'INSERT INTO users (username, password, role, level) VALUES (?, ?, ?, ?)',
                [user.username, user.password, user.role, user.level]
            );
        }
        console.log(`🎉 เพิ่มข้อมูลผู้ใช้งานตัวอย่างสำเร็จจำนวน ${mockUsers.length} คน!`);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
        }
        process.exit();
    }
};

seedData();
