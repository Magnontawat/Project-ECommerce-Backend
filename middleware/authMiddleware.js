/**
 * middleware/authMiddleware.js
 *
 * protect   — ตรวจสอบ JWT Token ก่อนเข้า Route ที่ต้องการ Login
 * adminOnly — ตรวจสอบสิทธิ์ Admin (ต้องใช้ต่อจาก protect เสมอ)
 */

const jwt = require('jsonwebtoken');

// ดึง Token จาก Header "Authorization: Bearer <token>"
// ถอดรหัสและเก็บข้อมูล User ไว้ใน req.user เพื่อให้ Controller ถัดไปใช้งานได้
const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET);
            return next();
        } catch {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }
};

// ต้องใช้ต่อจาก protect เสมอ เพราะต้องการ req.user ที่ protect สร้างไว้
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
};

module.exports = { protect, adminOnly };
