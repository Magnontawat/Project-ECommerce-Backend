const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cart');

const app = express();

// Middleware
// อนุญาตให้ Frontend ที่รันบนพอร์ต 5173 สามารถเรียก API นี้ได้
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json()); // สำหรับอ่าน request body ที่เป็น JSON

// Routes
// ทุก request ที่มายัง /api/books จะถูกส่งไปให้ bookRoutes จัดการ
app.use('/api/books', bookRoutes);
// เส้นทางสำหรับระบบ Login/Register
app.use('/api/auth', authRoutes);
// เส้นทางสำหรับระบบ Cart
app.use('/api/cart', cartRoutes);

// เส้นทางทดสอบเพื่อดูว่าเซิร์ฟเวอร์ทำงานอยู่
app.get('/', (req, res) => {
    res.send('BaBaBook API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
