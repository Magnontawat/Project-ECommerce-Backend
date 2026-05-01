const mysql = require('mysql2/promise'); // ใช้ promise เพื่อรองรับ async/await
require('dotenv').config();

// สร้าง Connection Pool เพื่อจัดการการเชื่อมต่อหลายๆ อันพร้อมกันอย่างมีประสิทธิภาพ
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบการเชื่อมต่อเมื่อเริ่มต้นใช้งาน
pool.getConnection()
    .then(connection => {
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
        connection.release(); // คืน connection กลับสู่ pool
    })
    .catch(err => {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
    });

module.exports = pool;
