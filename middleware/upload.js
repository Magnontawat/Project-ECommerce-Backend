/**
 * middleware/upload.js — จัดการการรับไฟล์รูปภาพปกหนังสือ
 *
 * ใช้ Multer ด้วย memoryStorage แทน diskStorage
 * เพราะเราจะส่ง Buffer ต่อไปยัง Cloudinary โดยตรง
 * ไม่จำเป็นต้องบันทึกไฟล์ลง Disk ของ Server อีกต่อไป
 *
 * หลังผ่าน Middleware นี้แล้ว req.file จะมี:
 *   req.file.buffer    — ข้อมูลรูปภาพเป็น Binary Buffer
 *   req.file.mimetype  — ประเภทไฟล์ เช่น image/jpeg
 *   req.file.size      — ขนาดไฟล์ (bytes)
 */

const multer = require('multer')
const path   = require('path')

// memoryStorage — เก็บไฟล์ไว้ใน RAM ชั่วคราว (req.file.buffer)
const storage = multer.memoryStorage()

// กรองประเภทไฟล์ที่อนุญาต: jpg, jpeg, png, webp เท่านั้น
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedExtensions.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // ขนาดสูงสุด 5MB
})

module.exports = upload
