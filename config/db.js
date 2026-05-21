/**
 * config/db.js — MySQL Connection Pool
 *
 * ใช้ Pool แทนการสร้าง Connection ใหม่ทุก Request
 * เพื่อประสิทธิภาพที่ดีกว่าและลด overhead ของการเชื่อมต่อ
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 2,   // hosting limit = 5, serverless spawn หลาย instance พร้อมกันได้
    queueLimit: 10,       // queue request แทนที่จะ reject ทันทีเมื่อ connection เต็ม
    idleTimeout: 60000,   // คืน connection กลับ pool หลังไม่ได้ใช้ 60s
    connectTimeout: 10000,
});


module.exports = pool;
