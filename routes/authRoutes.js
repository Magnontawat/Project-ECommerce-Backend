/**
 * routes/authRoutes.js — เส้นทาง API สำหรับระบบ Authentication
 *
 * Prefix: /api/auth (กำหนดใน index.js)
 *
 * Endpoints:
 *   POST /api/auth/register — สมัครสมาชิกใหม่
 *   POST /api/auth/login    — เข้าสู่ระบบ
 */

const express = require('express');
const router  = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// POST /api/auth/register — สมัครสมาชิก (ไม่ต้องการ Token)
router.post('/register', registerUser);

// POST /api/auth/login — เข้าสู่ระบบ (ไม่ต้องการ Token)
router.post('/login', loginUser);

module.exports = router;
