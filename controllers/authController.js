/**
 * controllers/authController.js — จัดการระบบ Authentication
 *
 * Controller คืออะไร?
 *   คือฟังก์ชันที่รับ Request จาก Route แล้วประมวลผล เช่น ดึงข้อมูลจาก DB
 *   แล้วส่ง Response กลับไปยัง Client
 *
 * ไฟล์นี้มี 2 Controller:
 *   1. registerUser — สมัครสมาชิกใหม่ (POST /api/auth/register)
 *   2. loginUser    — เข้าสู่ระบบ     (POST /api/auth/login)
 */

const db     = require('../config/db');
const bcrypt = require('bcryptjs');   // ไลบรารีสำหรับเข้ารหัส Password
const jwt    = require('jsonwebtoken'); // ไลบรารีสำหรับสร้าง JWT Token

// ─────────────────────────────────────────────
// Helper Function
// ─────────────────────────────────────────────

/**
 * generateToken — สร้าง JWT Token
 *
 * JWT (JSON Web Token) คืออะไร?
 *   เป็น String ที่เข้ารหัสข้อมูล User ไว้ เช่น id, role, username
 *   Frontend เก็บ Token นี้ไว้ แล้วส่งมาทุกครั้งที่เรียก API ที่ต้องการ Auth
 *   Backend ถอดรหัส Token เพื่อรู้ว่าใครเป็นคนส่ง Request มา
 *
 * @param {number} id       - ID ของ User ใน Database
 * @param {string} username - ชื่อผู้ใช้
 * @param {string} role     - สิทธิ์ ("user" หรือ "admin")
 * @param {number} level    - ระดับของผู้ใช้
 * @returns {string} JWT Token ที่หมดอายุใน 30 วัน
 */
const generateToken = (id, username, role, level) => {
    return jwt.sign(
        { id, username, role, level }, // Payload: ข้อมูลที่จะเข้ารหัสลงใน Token
        process.env.JWT_SECRET,         // Secret Key: กุญแจสำหรับเข้า/ถอดรหัส
        { expiresIn: '30d' }            // Token หมดอายุใน 30 วัน
    );
};

// ─────────────────────────────────────────────
// Register Controller
// ─────────────────────────────────────────────

/**
 * registerUser — สมัครสมาชิกใหม่
 *
 * @route  POST /api/auth/register
 * @access Public (ไม่ต้องการ Token)
 *
 * Request Body: { email, username, password }
 * Response 201: { id, email, username, role, level, token }
 */
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    // ── 1. ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่ ──
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        // ── 2. ตรวจสอบว่า Email ซ้ำหรือไม่ ──
        const [existingEmail] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingEmail.length > 0) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // ── 3. ตรวจสอบว่า Username ซ้ำหรือไม่ ──
        const [existingUsername] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        if (existingUsername.length > 0) {
            return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        // ── 4. เข้ารหัส (Hash) Password ก่อนบันทึก ──
        // bcrypt เป็น Algorithm ที่ออกแบบมาให้เข้ารหัสช้า เพื่อป้องกัน Brute Force
        // rounds=10 หมายถึงทำ hashing 2^10 = 1024 รอบ
        // ไม่เคยเก็บ Password ตรงๆ ลง DB เด็ดขาด!
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ── 5. บันทึก User ใหม่ลง Database ──
        const [result] = await db.query(
            'INSERT INTO users (email, username, password, role, level) VALUES (?, ?, ?, ?, ?)',
            [email, username, hashedPassword, 'user', 1]
        );

        const newUserId = result.insertId; // ID ที่ Database สร้างให้อัตโนมัติ

        // ── 6. ส่ง Response พร้อม Token กลับไป ──
        res.status(201).json({
            id:       newUserId,
            email:    email,
            username: username,
            role:     'user',
            level:    1,
            token:    generateToken(newUserId, username, 'user', 1),
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

// ─────────────────────────────────────────────
// Login Controller
// ─────────────────────────────────────────────

/**
 * loginUser — เข้าสู่ระบบ
 *
 * @route  POST /api/auth/login
 * @access Public (ไม่ต้องการ Token)
 *
 * Request Body: { email, password }
 * Response 200: { id, username, role, level, token }
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // ── 1. ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่ ──
    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    try {
        // ── 2. ค้นหา User จาก Email ──
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // ไม่พบ User ที่มี Email นี้ในระบบ
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });
        }

        const user = users[0];

        // ── 3. ตรวจสอบความถูกต้องของ Password ──
        // bcrypt.compare เปรียบเทียบ Plain Text กับ Hashed Password ใน DB
        // ไม่สามารถถอดรหัส Hash ได้โดยตรง จะ hash Plain Text แล้วเปรียบเทียบแทน
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // ── 4. ส่ง Response พร้อม Token กลับไป ──
        res.status(200).json({
            id:       user.id,
            username: user.username,
            role:     user.role,   // "user" หรือ "admin" — Frontend ใช้ตรวจสอบสิทธิ์
            level:    user.level,
            token:    generateToken(user.id, user.username, user.role, user.level),
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

module.exports = { registerUser, loginUser };
