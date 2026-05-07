/**
 * middleware/authMiddleware.js — Middleware ตรวจสอบสิทธิ์ผู้ใช้
 *
 * Middleware คืออะไร?
 *   คือฟังก์ชันที่ทำงาน "ระหว่างทาง" ก่อนที่ Request จะถึง Controller
 *   เปรียบเหมือนยามรักษาความปลอดภัยที่ตรวจบัตรก่อนเข้าอาคาร
 *
 * ไฟล์นี้มี 2 Middleware:
 *   1. protect   — ตรวจสอบว่าผู้ใช้ Login แล้วหรือยัง (มี JWT Token ที่ถูกต้องหรือไม่)
 *   2. adminOnly — ตรวจสอบว่าผู้ใช้มีสิทธิ์ Admin หรือไม่
 */

const jwt = require('jsonwebtoken');

/**
 * protect — ตรวจสอบ JWT Token
 *
 * ขั้นตอนการทำงาน:
 *   1. ดึง Token จาก Header "Authorization: Bearer <token>"
 *   2. ถอดรหัส Token ด้วย JWT_SECRET
 *   3. ถ้าถูกต้อง → เก็บข้อมูล User ไว้ใน req.user แล้วปล่อยผ่าน
 *   4. ถ้าผิดพลาด → ส่ง 401 Unauthorized กลับไป
 *
 * ผลลัพธ์: หลังผ่าน protect แล้ว Controller สามารถเข้าถึง req.user ได้
 *   req.user.id       — ID ของผู้ใช้
 *   req.user.username — ชื่อผู้ใช้
 *   req.user.role     — สิทธิ์ ("user" หรือ "admin")
 *   req.user.level    — ระดับของผู้ใช้
 */
const protect = (req, res, next) => {
    let token;

    // ตรวจว่า Header มี Authorization และขึ้นต้นด้วย "Bearer "
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // แยก Token ออกจาก "Bearer eyJhbGci..." → ได้แค่ "eyJhbGci..."
            token = req.headers.authorization.split(' ')[1];

            // ถอดรหัส Token ด้วย Secret Key — ถ้า Token ถูกแก้ไขหรือหมดอายุจะ throw Error
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // เก็บข้อมูล User ที่อยู่ใน Token ไว้ใน req.user เพื่อให้ Controller ถัดไปใช้งานได้
            req.user = decoded;

            return next(); // ปล่อยผ่านไปยัง Middleware หรือ Controller ถัดไป
        } catch (error) {
            // Token ไม่ถูกต้อง (ถูกแก้ไข, หมดอายุ, หรือ Secret ไม่ตรง)
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
        }
    }

    // ไม่มี Token ใน Header เลย
    if (!token) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }
};

/**
 * adminOnly — ตรวจสอบสิทธิ์ Admin
 *
 * ต้องใช้ต่อจาก protect เสมอ เพราะต้องการ req.user ที่ protect สร้างไว้
 * ตรวจสอบว่า req.user.role เป็น "admin" หรือไม่
 *
 * ตัวอย่างการใช้งานใน Route:
 *   router.post('/', protect, adminOnly, createBook)
 *                    ↑ ตรวจ token ก่อน  ↑ แล้วจึงตรวจ role
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next(); // เป็น Admin → ปล่อยผ่าน
    }
    // ไม่ใช่ Admin → ปฏิเสธการเข้าถึง
    res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดำเนินการนี้' });
};

module.exports = { protect, adminOnly };
