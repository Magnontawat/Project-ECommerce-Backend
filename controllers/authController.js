const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// สร้าง JWT Token
const generateToken = (id, username, role, level) => {
    return jwt.sign({ id, username, role, level }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'กรุณากรอก Email, Username และ Password ให้ครบถ้วน' });
    }

    try {
        // เช็คว่า email มีในระบบหรือยัง
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email นี้ถูกใช้งานแล้ว' });
        }

        // เข้ารหัส (Hash) password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // บันทึก user ใหม่ลง DB (ค่าเริ่มต้น role = buyer, level = 1)
        const [result] = await db.query(
            'INSERT INTO users (email, username, password, role, level) VALUES (?, ?, ?, ?, ?)',
            [email, username, hashedPassword, 'buyer', 1]
        );

        // ดึงข้อมูล user ที่เพิ่งสร้าง
        const newUserId = result.insertId;

        res.status(201).json({
            id: newUserId,
            email: email,
            username: username,
            role: 'buyer',
            level: 1,
            token: generateToken(newUserId, username, 'buyer', 1)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอก Email และ Password ให้ครบถ้วน' });
    }

    try {
        // ค้นหา user ตาม email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        //ถ้าไม่เจอ
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email หรือ Password ไม่ถูกต้อง' });
        }

        //เลือกอันแรก
        const user = users[0];

        // ตรวจสอบความถูกต้องของ password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                level: user.level,
                token: generateToken(user.id, user.username, user.role, user.level)
            });
        } else {
            res.status(401).json({ message: 'Email หรือ Password ไม่ถูกต้อง' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
};

module.exports = {
    registerUser,
    loginUser
};
