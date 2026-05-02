const jwt = require('jsonwebtoken');

// Middleware สำหรับตรวจสอบ JWT Token
const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // ดึง Token ออกจาก header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];
            console.log("Token", token);
            // ถอดรหัส (Verify) Token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Protect decoded ผ่านแล้ว", decoded);
            // เก็บข้อมูล user (ที่อยู่ใน token) ลงใน req.user เพื่อให้ controller อื่นๆ ใช้งานต่อได้
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'ไม่ได้รับอนุญาต (Unauthorized), Token ไม่ถูกต้อง' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'ไม่ได้รับอนุญาต (Unauthorized), ไม่พบ Token' });
    }
};

// Middleware สำหรับตรวจสอบ Role ว่าเป็น Admin หรือไม่
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'buyer') {
        next();
    } else {
        res.status(403).json({ message: 'สิทธิ์การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
    }
};

module.exports = { protect, adminOnly };
