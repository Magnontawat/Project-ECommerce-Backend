/**
 * config/db.js — MySQL Connection Pool
 *
 * ใช้ Pool แทนการสร้าง Connection ใหม่ทุก Request
 * เพื่อประสิทธิภาพที่ดีกว่าและลด overhead ของการเชื่อมต่อ
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
});

// ทดสอบการเชื่อมต่อตอน Server เริ่มต้น
pool.getConnection()
    .then((connection) => {
        console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
        connection.release();
    })
    .catch((err) => {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
    });

module.exports = pool;
