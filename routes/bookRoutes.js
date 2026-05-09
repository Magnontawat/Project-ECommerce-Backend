/**
 * routes/bookRoutes.js — เส้นทาง API สำหรับหนังสือ
 *
 * Prefix: /api/books (กำหนดใน index.js)
 *
 * Endpoints:
 *   GET    /api/books      — ดึงหนังสือทั้งหมด (Public)
 *   GET    /api/books/:id  — ดึงหนังสือตาม ID  (Public)
 *   POST   /api/books      — เพิ่มหนังสือใหม่  (Admin)
 *   PUT    /api/books/:id  — แก้ไขหนังสือ      (Admin)
 *   DELETE /api/books/:id  — ลบหนังสือ         (Admin)
 *
 * Middleware Chain อธิบาย:
 *   protect              → ตรวจสอบว่า Login แล้ว (มี JWT Token ถูกต้อง)
 *   adminOnly            → ตรวจสอบว่า role === "admin"
 *   upload.single(...)   → รับไฟล์รูปภาพจาก FormData
 *   controller           → ประมวลผลและส่ง Response
 */

const express  = require('express');
const router   = express.Router();
const { getBooks, getBookById, addBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload   = require('../middleware/upload');

// ─── Public Routes (ไม่ต้องการ Token) ───────────────
router.get('/', getBooks);      // GET /api/books
router.get('/:id', getBookById);   // GET /api/books/:id

// ─── Admin Routes (ต้องการ Token + Admin Role) ───────
// POST /api/books — เพิ่มหนังสือใหม่ (รับไฟล์รูปภาพด้วย)
router.post('/', protect, adminOnly, upload.single('cover_image'), addBook);

// PUT /api/books/:id — แก้ไขหนังสือ (รับไฟล์รูปภาพด้วย)
router.put('/:id', protect, adminOnly, upload.single('cover_image'), updateBook);

// DELETE /api/books/:id — ลบหนังสือ
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
