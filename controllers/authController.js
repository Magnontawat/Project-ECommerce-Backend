/**
 * controllers/authController.js
 *
 * registerUser — สมัครสมาชิกใหม่  (POST /api/auth/register)
 * loginUser    — เข้าสู่ระบบ      (POST /api/auth/login)
 */

const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// สร้าง JWT Token อายุ 30 วัน เก็บ payload: { id, username, role, level }
const generateToken = (id, username, role, level) => {
    return jwt.sign(
        { id, username, role, level },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/auth/register
 * @access Public
 * @body   { email, username, password }
 */
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        // ตรวจ email และ username ซ้ำ → 409 Conflict (ไม่ใช่ 400)
        const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (email, username, password, role, level) VALUES (?, ?, ?, ?, ?)',
            [email, username, hashedPassword, 'user', 1]
        );

        const newUserId = result.insertId;

        res.status(201).json({
            id:       newUserId,
            email,
            username,
            role:     'user',
            level:    1,
            token:    generateToken(newUserId, username, 'user', 1),
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/auth/login
 * @access Public
 * @body   { email, password }
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        // email ไม่พบ → 404, password ผิด → 401 (แยก error ให้ชัดเจน)
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        res.status(200).json({
            id:       user.id,
            username: user.username,
            role:     user.role,
            level:    user.level,
            token:    generateToken(user.id, user.username, user.role, user.level),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

module.exports = { registerUser, loginUser };
