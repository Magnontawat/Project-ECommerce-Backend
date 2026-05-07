/**
 * middleware/upload.js — จัดการการอัพโหลดไฟล์รูปภาพปกหนังสือ
 *
 * ใช้ไลบรารี Multer ซึ่งเป็น Middleware สำหรับรับไฟล์จาก multipart/form-data
 *
 * Multer ทำงานอย่างไร?
 *   เมื่อ Frontend ส่ง FormData ที่มีไฟล์รูปมาด้วย
 *   Multer จะดักจับไฟล์นั้น บันทึกลง Disk และใส่ข้อมูลไว้ใน req.file
 *   Controller จึงสามารถเข้าถึง req.file.filename เพื่อนำ URL ไปบันทึกใน DB ได้
 */

const multer = require('multer');
const path   = require('path');

/**
 * diskStorage — กำหนดวิธีบันทึกไฟล์ลง Disk
 *
 * ทางเลือกอื่นคือ memoryStorage (เก็บในหน่วยความจำ) แต่เราใช้ diskStorage
 * เพราะต้องการ URL ที่ถาวรสำหรับแสดงรูปบน Frontend
 */
const storage = multer.diskStorage({
    // destination — กำหนด Folder ที่จะบันทึกไฟล์
    destination: (req, file, cb) => {
        cb(null, 'uploads/covers/'); // บันทึกที่ ./uploads/covers/
    },

    // filename — กำหนดชื่อไฟล์ที่บันทึก
    filename: (req, file, cb) => {
        // ใช้ timestamp เพื่อป้องกันชื่อซ้ำ เช่น cover_1715000000000.jpg
        const ext = path.extname(file.originalname).toLowerCase(); // ดึงนามสกุล เช่น .jpg
        cb(null, `cover_${Date.now()}${ext}`);
    },
});

/**
 * fileFilter — กรองประเภทไฟล์ที่อนุญาต
 * รับเฉพาะ .jpg, .jpeg, .png, .webp เท่านั้น
 */
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true); // อนุญาตไฟล์นี้
    } else {
        cb(new Error('รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น'), false); // ปฏิเสธไฟล์นี้
    }
};

/**
 * upload — สร้าง Multer Instance พร้อม Config ทั้งหมด
 *
 * การใช้งานใน Route:
 *   router.post('/', upload.single('cover_image'), controller)
 *   'cover_image' คือชื่อ field ใน FormData ที่ Frontend ส่งมา
 *
 * หลังผ่าน Middleware นี้แล้ว req.file จะมีข้อมูล:
 *   req.file.filename  — ชื่อไฟล์ที่บันทึก เช่น cover_1715000000000.jpg
 *   req.file.path      — Path เต็ม เช่น uploads/covers/cover_1715000000000.jpg
 *   req.file.size      — ขนาดไฟล์ (bytes)
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // ขนาดไฟล์สูงสุด 5MB (5 × 1024 × 1024 bytes)
    },
});

module.exports = upload;
