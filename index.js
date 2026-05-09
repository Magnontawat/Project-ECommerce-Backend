/**
 * index.js — Entry Point
 *
 * สร้าง Express App, ลงทะเบียน Middleware และ Routes ทั้งหมด
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const bookRoutes  = require('./routes/bookRoutes');
const authRoutes  = require('./routes/authRoutes');
const cartRoutes  = require('./routes/cart');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// อนุญาตให้ Frontend (localhost:5173) เรียก API ข้าม Origin ได้
app.use(cors({
    origin:      'http://localhost:5173',
    methods:     ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());

// Serve รูปภาพที่อัพโหลด: GET /uploads/covers/xxx.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/books',  bookRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/cart',   cartRoutes);
app.use('/api/orders', orderRoutes);

// Health Check
app.get('/', (req, res) => res.send('BaBaBook API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
