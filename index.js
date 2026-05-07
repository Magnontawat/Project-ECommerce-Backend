/**
 * index.js — จุดเริ่มต้นของแอปพลิเคชัน (Entry Point)
 *
 * ไฟล์นี้ทำหน้าที่:
 *  1. สร้าง Express App
 *  2. ลงทะเบียน Middleware ที่ใช้ร่วมกันทั้งแอป
 *  3. ลงทะเบียน Routes ทั้งหมด
 *  4. เปิดรับ Request บน Port ที่กำหนด
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config(); // โหลดค่าจากไฟล์ .env เข้าสู่ process.env

// --- Import Routes ---
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cart');

const app = express();

// ─────────────────────────────────────────────
// Middleware (ทำงานก่อน Request จะถึง Route)
// ─────────────────────────────────────────────

/**
 * CORS — Cross-Origin Resource Sharing
 * อนุญาตให้ Frontend (http://localhost:5173) เรียก API นี้ได้
 * ถ้าไม่ตั้งค่านี้ Browser จะบล็อก Request จาก Domain อื่น
 */
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

/**
 * express.json() — แปลง Request Body จาก JSON String เป็น JavaScript Object
 * ทำให้ใน Controller เราเข้าถึง req.body ได้เลย เช่น req.body.email
 */
app.use(express.json());

/**
 * express.static() — Serve ไฟล์ Static (รูปภาพ, CSS, JS)
 * เมื่อมี Request มาที่ /uploads/... จะไปหาไฟล์ใน folder uploads/ ของโปรเจกต์
 * ตัวอย่าง: GET /uploads/covers/cover_123.jpg → อ่านไฟล์จาก ./uploads/covers/cover_123.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────
// Routes — แต่ละ Group ของ API Endpoint
// ─────────────────────────────────────────────

// Endpoint ทุกตัวที่ขึ้นต้นด้วย /api/books จะถูกส่งไปจัดการที่ bookRoutes
app.use('/api/books', bookRoutes);

// Endpoint ทุกตัวที่ขึ้นต้นด้วย /api/auth จะถูกส่งไปจัดการที่ authRoutes
app.use('/api/auth', authRoutes);

// Endpoint ทุกตัวที่ขึ้นต้นด้วย /api/cart จะถูกส่งไปจัดการที่ cartRoutes
app.use('/api/cart', cartRoutes);

// ─────────────────────────────────────────────
// Health Check Endpoint
// ─────────────────────────────────────────────

// GET / — ใช้ตรวจสอบว่า Server รันอยู่หรือเปล่า
app.get('/', (req, res) => {
    res.send('BaBaBook API is running...');
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
