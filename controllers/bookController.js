/**
 * controllers/bookController.js — จัดการข้อมูลหนังสือ
 *
 * ไฟล์นี้มี 5 Controller:
 *   1. getBooks    — ดึงหนังสือทั้งหมด         (GET  /api/books)
 *   2. getBookById — ดึงหนังสือตาม ID           (GET  /api/books/:id)
 *   3. addBook     — เพิ่มหนังสือใหม่ (Admin)   (POST /api/books)
 *   4. updateBook  — แก้ไขหนังสือ (Admin)       (PUT  /api/books/:id)
 *   5. deleteBook  — ลบหนังสือ (Admin)           (DELETE /api/books/:id)
 */

const db = require('../config/db');

// ─────────────────────────────────────────────
// Helper Functions (ฟังก์ชันช่วยเหลือ)
// ─────────────────────────────────────────────

/**
 * getVariants — ดึงรายการ Variant ของหนังสือเล่มนั้น
 *
 * Variant คืออะไร? → ประเภทฉบับของหนังสือเล่มเดียวกัน เช่น ภาษาไทย, ภาษาอังกฤษ, eBook
 * แต่ละ Variant มีราคาและจำนวนสต็อกแยกกัน
 *
 * @param {number} bookId - ID ของหนังสือ
 * @returns {Array} รายการ Variant ของหนังสือเล่มนั้น
 */
const getVariants = async (bookId) => {
    const [variants] = await db.query(
        // ORDER BY FIELD เรียงลำดับ type ตามที่กำหนด: th → en → ebook
        'SELECT id, book_id, type, price, stock FROM book_variants WHERE book_id = ? ORDER BY FIELD(type, "th", "en", "ebook")',
        [bookId]
    );
    return variants;
};

/**
 * buildCoverUrl — สร้าง URL ของรูปปกจากไฟล์ที่อัพโหลด
 *
 * ถ้ามีการอัพโหลดไฟล์ (req.file) จาก Multer จะสร้าง URL แบบเต็ม
 * ตัวอย่าง: http://localhost:5000/uploads/covers/cover_1715000000000.jpg
 *
 * @param {Object} req - Express Request Object
 * @returns {string|null} URL ของรูปปก หรือ null ถ้าไม่มีการอัพโหลด
 */
const buildCoverUrl = (req) => {
    if (req.file) {
        // สร้าง URL จาก protocol (http/https) + hostname + path ของไฟล์
        return `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;
    }
    return null;
};

// ─────────────────────────────────────────────
// 1. Get All Books
// ─────────────────────────────────────────────

/**
 * getBooks — ดึงหนังสือทั้งหมดพร้อม Variants
 *
 * @route  GET /api/books
 * @access Public (ไม่ต้องการ Token)
 */
const getBooks = async (req, res) => {
    try {
        // ดึงข้อมูลหนังสือทั้งหมด เรียงจากใหม่ไปเก่า
        const [books] = await db.query(
            `SELECT b.id, b.title, b.author, b.publisher, b.publish_year,
                    b.genre, b.synopsis, b.cover_image_url, b.created_at
             FROM books b
             ORDER BY b.created_at DESC`
        );

        // Promise.all ดึง Variants ของทุกเล่มพร้อมกัน (ขนาน) แทนการรอทีละเล่ม
        // ถ้ามี 100 เล่ม แทนที่จะรอ 100 Query แบบ Serial จะรันพร้อมกันทั้งหมด
        const booksWithVariants = await Promise.all(
            books.map(async (book) => ({
                ...book,                              // spread ข้อมูลหนังสือ
                variants: await getVariants(book.id), // เพิ่ม variants เข้าไป
            }))
        );

        res.status(200).json(booksWithVariants);

    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// ─────────────────────────────────────────────
// 2. Get Book by ID
// ─────────────────────────────────────────────

/**
 * getBookById — ดึงหนังสือตาม ID พร้อม Variants
 *
 * @route  GET /api/books/:id
 * @access Public (ไม่ต้องการ Token)
 */
const getBookById = async (req, res) => {
    try {
        const id = req.params.id; // ดึง :id จาก URL เช่น GET /api/books/5 → id = "5"

        const [rows] = await db.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [id]
        );

        // ถ้าไม่พบหนังสือ → ส่ง 404
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการ' });
        }

        const book     = rows[0];
        book.variants  = await getVariants(book.id);

        res.status(200).json(book);

    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// ─────────────────────────────────────────────
// 3. Add New Book (Admin Only)
// ─────────────────────────────────────────────

/**
 * addBook — เพิ่มหนังสือใหม่พร้อม Variants
 *
 * @route   POST /api/books
 * @access  Private (Admin Only)
 * @content multipart/form-data (เพราะมีการอัพโหลดไฟล์รูป)
 *
 * Request Body Fields:
 *   title, author, genre (required)
 *   publisher, publish_year, synopsis (optional)
 *   variants — JSON string ของ array เช่น '[{"type":"th","price":320,"stock":50}]'
 *   cover_image — ไฟล์รูปภาพ (optional)
 */
const addBook = async (req, res) => {
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;
    const cover_image_url = buildCoverUrl(req); // URL รูปปกจาก Multer (null ถ้าไม่ได้อัพโหลด)

    // ── 1. ตรวจสอบ Required Fields ──
    if (!title || !author || !genre) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ (title, author, genre)' });
    }

    // ── 2. แปลง variants จาก JSON String เป็น Array ──
    // Frontend ส่งมาเป็น String เพราะ FormData รองรับแค่ String และ File
    // ตัวอย่าง: '[{"type":"th","price":320,"stock":50}]'
    let variants = [];
    try {
        variants = JSON.parse(req.body.variants || '[]');
    } catch {
        return res.status(400).json({ message: 'รูปแบบ variants ไม่ถูกต้อง กรุณาส่งเป็น JSON Array string' });
    }

    // ── 3. ตรวจสอบ Variants ──
    if (!Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ message: 'กรุณาระบุ variants อย่างน้อย 1 รายการ' });
    }

    const allowedTypes = ['th', 'en', 'ebook'];
    const typesSeen    = new Set(); // ใช้ Set ตรวจสอบว่ามี type ซ้ำหรือไม่

    for (const v of variants) {
        if (!allowedTypes.includes(v.type)) {
            return res.status(400).json({ message: `ประเภท variant ไม่ถูกต้อง: "${v.type}" (ต้องเป็น th, en หรือ ebook)` });
        }
        if (typesSeen.has(v.type)) {
            return res.status(400).json({ message: `ประเภท variant ซ้ำกัน: "${v.type}"` });
        }
        if (v.price === undefined || v.price === null || v.stock === undefined) {
            return res.status(400).json({ message: `variant "${v.type}" ต้องมี price และ stock` });
        }
        typesSeen.add(v.type);
    }

    // ── 4. บันทึก Book และ Variants ลง DB ด้วย Transaction ──
    //
    // Transaction คืออะไร?
    //   การรันหลาย Query พร้อมกันแบบ "ทั้งหมดหรือไม่มีเลย"
    //   ถ้า Query ใด Query หนึ่งผิดพลาด ระบบจะ Rollback ยกเลิกทุกอย่าง
    //   ป้องกันข้อมูลไม่สมบูรณ์ เช่น มี book แต่ไม่มี variants
    //
    const conn = await db.getConnection(); // ขอ Connection จาก Pool
    try {
        await conn.beginTransaction(); // เริ่ม Transaction

        // Insert ข้อมูลหลักของหนังสือ
        const [bookResult] = await conn.query(
            `INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, author, publisher || null, publish_year || null, genre, synopsis || null, cover_image_url]
        );
        const bookId = bookResult.insertId;

        // Insert Variants ทั้งหมดในครั้งเดียว (Batch Insert)
        // variantRows = [[bookId, "th", 320, 50], [bookId, "ebook", 149, 999]]
        const variantRows = variants.map((v) => [bookId, v.type, v.price, v.stock ?? 0]);
        await conn.query(
            'INSERT INTO book_variants (book_id, type, price, stock) VALUES ?',
            [variantRows]
        );

        await conn.commit(); // ยืนยันการบันทึก (ถ้าถึงบรรทัดนี้ได้แสดงว่าทุกอย่างสำเร็จ)

        // ดึงข้อมูลที่เพิ่งบันทึกเพื่อส่งกลับ
        const [newBook]        = await conn.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [bookId]
        );
        newBook[0].variants = await getVariants(bookId);

        res.status(201).json({
            message: 'เพิ่มหนังสือสำเร็จ',
            book: newBook[0],
        });

    } catch (error) {
        await conn.rollback(); // ยกเลิกทุกอย่างถ้าเกิด Error
        console.error('Add book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหนังสือ' });
    } finally {
        conn.release(); // คืน Connection กลับสู่ Pool ทุกกรณี
    }
};

// ─────────────────────────────────────────────
// 4. Update Book (Admin Only)
// ─────────────────────────────────────────────

/**
 * updateBook — แก้ไขข้อมูลหนังสือและ Variants
 *
 * @route   PUT /api/books/:id
 * @access  Private (Admin Only)
 * @content multipart/form-data
 *
 * ถ้าไม่ส่ง field มาจะใช้ค่าเดิม (Partial Update)
 * ถ้าส่ง variants มา จะลบของเดิมทั้งหมดแล้วแทนด้วยชุดใหม่
 */
const updateBook = async (req, res) => {
    const id = req.params.id;
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // ── 1. ตรวจสอบว่ามีหนังสือนี้อยู่หรือไม่ ──
        const [existing] = await conn.query('SELECT * FROM books WHERE id = ?', [id]);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการแก้ไข' });
        }
        const old = existing[0]; // ข้อมูลเดิม ใช้เป็น fallback ถ้าไม่ส่ง field มา

        // ── 2. จัดการรูปปก ──
        // ถ้ามีการอัพโหลดไฟล์ใหม่ → ใช้ URL ใหม่
        // ถ้าไม่มี → ใช้ URL เดิมจาก DB
        const cover_image_url = req.file ? buildCoverUrl(req) : old.cover_image_url;

        // ── 3. อัพเดตข้อมูลหลักของหนังสือ ──
        await conn.query(
            `UPDATE books SET
                title           = ?,
                author          = ?,
                publisher       = ?,
                publish_year    = ?,
                genre           = ?,
                synopsis        = ?,
                cover_image_url = ?
             WHERE id = ?`,
            [
                title        || old.title,
                author       || old.author,
                publisher    !== undefined ? publisher    : old.publisher,
                publish_year !== undefined ? publish_year : old.publish_year,
                genre        || old.genre,
                synopsis     !== undefined ? synopsis     : old.synopsis,
                cover_image_url,
                id,
            ]
        );

        // ── 4. อัพเดต Variants (ถ้าส่งมา) ──
        if (req.body.variants) {
            let variants = [];
            try {
                variants = JSON.parse(req.body.variants);
            } catch {
                await conn.rollback();
                return res.status(400).json({ message: 'รูปแบบ variants ไม่ถูกต้อง' });
            }

            // ลบ Variants เดิมทั้งหมด แล้วใส่ชุดใหม่
            // ON DELETE CASCADE จะจัดการ FK ให้อัตโนมัติ
            await conn.query('DELETE FROM book_variants WHERE book_id = ?', [id]);
            if (variants.length > 0) {
                const variantRows = variants.map((v) => [id, v.type, v.price, v.stock ?? 0]);
                await conn.query(
                    'INSERT INTO book_variants (book_id, type, price, stock) VALUES ?',
                    [variantRows]
                );
            }
        }

        await conn.commit();

        // ดึงข้อมูลล่าสุดเพื่อส่งกลับ
        const [updated]        = await conn.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [id]
        );
        updated[0].variants = await getVariants(id);

        res.status(200).json({
            message: 'แก้ไขข้อมูลหนังสือสำเร็จ',
            book: updated[0],
        });

    } catch (error) {
        await conn.rollback();
        console.error('Update book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลหนังสือ' });
    } finally {
        conn.release();
    }
};

// ─────────────────────────────────────────────
// 5. Delete Book (Admin Only)
// ─────────────────────────────────────────────

/**
 * deleteBook — ลบหนังสือและ Variants ทั้งหมด
 *
 * @route  DELETE /api/books/:id
 * @access Private (Admin Only)
 *
 * หมายเหตุ: Variants จะถูกลบโดยอัตโนมัติเพราะตั้งค่า ON DELETE CASCADE ใน DB
 */
const deleteBook = async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);

        // affectedRows = 0 หมายถึงไม่พบแถวที่ตรงกัน → หนังสือไม่มีอยู่
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการลบ' });
        }

        res.status(200).json({ message: 'ลบหนังสือสำเร็จ' });

    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหนังสือ' });
    }
};

module.exports = { getBooks, getBookById, addBook, updateBook, deleteBook };
