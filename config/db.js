/**
 * config/db.js — การเชื่อมต่อฐานข้อมูล MySQL
 *
 * ใช้ "Connection Pool" แทนการสร้าง Connection ใหม่ทุกครั้งที่มี Request
 *
 * Connection Pool คืออะไร?
 *   ลองนึกถึงพนักงานในออฟฟิศ แทนที่จะจ้างคนใหม่ทุกครั้งที่มีงาน
 *   เราเตรียมพนักงาน 10 คนไว้รอ พอมีงานก็หยิบคนที่ว่างมาใช้ พอเสร็จก็คืน Pool
 *   วิธีนี้เร็วกว่าและประหยัด Resource กว่าการสร้าง Connection ใหม่ทุกครั้ง
 */

const mysql = require('mysql2/promise'); // ใช้ promise version เพื่อรองรับ async/await
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST,     // ที่อยู่ของ Database Server (ปกติ localhost)
    user:     process.env.DB_USER,     // ชื่อผู้ใช้ MySQL (ปกติ root)
    password: process.env.DB_PASSWORD, // รหัสผ่าน MySQL
    database: process.env.DB_NAME,     // ชื่อ Database ที่จะใช้งาน

    waitForConnections: true, // ถ้า Connection เต็มให้รอแทนการ Error
    connectionLimit: 10,      // จำนวน Connection สูงสุดใน Pool
    queueLimit: 0,            // 0 = ไม่จำกัดจำนวน Request ที่รอคิว
});

// ทดสอบการเชื่อมต่อตอนเริ่มต้น Server
pool.getConnection()
    .then(connection => {
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
        connection.release(); // คืน Connection กลับสู่ Pool ทันทีหลังทดสอบ
    })
    .catch(err => {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
    });

// Export pool เพื่อให้ไฟล์อื่น import ไปใช้ได้
// ตัวอย่างการใช้: const [rows] = await db.query('SELECT * FROM books')
module.exports = pool;
