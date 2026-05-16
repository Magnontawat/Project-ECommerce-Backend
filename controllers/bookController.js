/**
 * controllers/bookController.js
 *
 * getBooks    — ดึงหนังสือทั้งหมด         (GET    /api/books)
 * getBookById — ดึงหนังสือตาม ID           (GET    /api/books/:id)
 * addBook     — เพิ่มหนังสือใหม่ (Admin)   (POST   /api/books)
 * updateBook  — แก้ไขหนังสือ (Admin)       (PUT    /api/books/:id)
 * deleteBook  — ลบหนังสือ (Admin)           (DELETE /api/books/:id)
 */

const db         = require('../config/db');
const cloudinary = require('../config/cloudinary');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ดึง variants ของหนังสือ เรียงลำดับ th → en → ebook เสมอ
const getVariants = async (bookId) => {
    const [variants] = await db.query(
        'SELECT id, book_id, type, price, stock FROM book_variants WHERE book_id = ? ORDER BY FIELD(type, "th", "en", "ebook")',
        [bookId]
    );
    return variants;
};

/**
 * อัพโหลด Buffer ไปยัง Cloudinary แล้วคืน Secure URL ของรูปที่บันทึก
 *
 * ทำไมต้อง Wrap ด้วย Promise?
 *   upload_stream ทำงานแบบ Callback-based (แบบเก่า)
 *   การ Wrap ด้วย Promise ทำให้เราใช้ async/await ได้ (แบบใหม่ที่อ่านง่ายกว่า)
 */
const uploadToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: 'bababook/covers' }, (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            })
            .end(buffer);
    });

/**
 * ดึง public_id จาก Cloudinary URL เพื่อใช้ในการลบรูป
 *
 * URL ตัวอย่าง: https://res.cloudinary.com/xxx/image/upload/v1234/bababook/covers/abc.jpg
 * public_id   : bababook/covers/abc
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    const afterUpload = url.slice(uploadIndex + 8).replace(/^v\d+\//, ''); // ลบ version (v1234/)
    return afterUpload.replace(/\.[^/.]+$/, '');                           // ลบนามสกุลไฟล์
};

// ลบรูปออกจาก Cloudinary — ไม่ throw ถ้าลบไม่ได้ เพื่อไม่ขัดการทำงานหลัก
const deleteFromCloudinary = async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

// ─── Get All Books ────────────────────────────────────────────────────────────

/**
 * @route  GET /api/books
 * @access Public
 */
const getBooks = async (req, res) => {
    try {
        const [books] = await db.query(
            `SELECT b.id, b.title, b.author, b.publisher, b.publish_year,
                    b.genre, b.synopsis, b.cover_image_url, b.created_at
             FROM books b
             WHERE b.is_active = 1
             ORDER BY b.created_at DESC`
        );

        const booksWithVariants = await Promise.all(
            books.map(async (book) => ({ ...book, variants: await getVariants(book.id) }))
        );

        res.status(200).json(booksWithVariants);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// ─── Get Book by ID ───────────────────────────────────────────────────────────

/**
 * @route  GET /api/books/:id
 * @access Public
 */
const getBookById = async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ? AND is_active = 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการ' });
        }

        const book    = rows[0];
        book.variants = await getVariants(book.id);

        res.status(200).json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// ─── Add New Book ─────────────────────────────────────────────────────────────

/**
 * @route   POST /api/books
 * @access  Admin
 * @content multipart/form-data (รองรับอัพโหลดรูปปก)
 *
 * variants ส่งมาเป็น JSON string เพราะ FormData รองรับแค่ String และ File
 * ตัวอย่าง: '[{"type":"th","price":320,"stock":50}]'
 */
const addBook = async (req, res) => {
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;

    if (!title || !author || !genre) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ (title, author, genre)' });
    }

    let variants = [];
    try {
        variants = JSON.parse(req.body.variants || '[]');
    } catch {
        return res.status(400).json({ message: 'รูปแบบ variants ไม่ถูกต้อง กรุณาส่งเป็น JSON Array string' });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ message: 'กรุณาระบุ variants อย่างน้อย 1 รายการ' });
    }

    const allowedTypes = ['th', 'en', 'ebook'];
    const typesSeen    = new Set();

    for (const v of variants) {
        if (!allowedTypes.includes(v.type)) {
            return res.status(400).json({ message: `ประเภท variant ไม่ถูกต้อง: "${v.type}" (ต้องเป็น th, en หรือ ebook)` });
        }
        if (typesSeen.has(v.type)) {
            return res.status(400).json({ message: `ประเภท variant ซ้ำกัน: "${v.type}"` });
        }
        if (v.price === undefined || v.price === null) {
            return res.status(400).json({ message: `variant "${v.type}" ต้องมี price` });
        }
        if (v.type !== 'ebook' && (v.stock == null || isNaN(Number(v.stock)))) {
            return res.status(400).json({ message: `variant "${v.type}" ต้องมี stock` });
        }
        typesSeen.add(v.type);
    }

    // อัพโหลดรูปไปยัง Cloudinary ก่อน (ถ้ามีไฟล์)
    // ทำก่อน Transaction เพราะถ้า Cloudinary ล้มเหลวไม่ต้องเปิด DB connection เลย
    let cover_image_url = null;
    if (req.file) {
        try {
            cover_image_url = await uploadToCloudinary(req.file.buffer);
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' });
        }
    }

    // ใช้ Transaction เพื่อให้ book และ variants บันทึกสำเร็จพร้อมกัน หรือยกเลิกทั้งหมด
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [bookResult] = await conn.query(
            `INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, author, publisher || null, publish_year || null, genre, synopsis || null, cover_image_url]
        );
        const bookId = bookResult.insertId;

        // stock ของ ebook เป็น null เสมอ (ไม่จำกัดจำนวน)
        const variantRows = variants.map((v) => [bookId, v.type, v.price, v.type === 'ebook' ? (v.stock ?? null) : v.stock]);
        await conn.query('INSERT INTO book_variants (book_id, type, price, stock) VALUES ?', [variantRows]);

        await conn.commit();

        const [newBook] = await conn.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [bookId]
        );
        newBook[0].variants = await getVariants(bookId);

        res.status(201).json({ message: 'เพิ่มหนังสือสำเร็จ', book: newBook[0] });
    } catch (error) {
        await conn.rollback();
        // DB ล้มเหลวหลัง upload สำเร็จแล้ว → ลบรูปออกจาก Cloudinary ไม่ให้ค้างไว้
        if (cover_image_url) await deleteFromCloudinary(cover_image_url);
        console.error('Add book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหนังสือ' });
    } finally {
        conn.release();
    }
};

// ─── Update Book ──────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/books/:id
 * @access  Admin
 * @content multipart/form-data
 *
 * Partial update — field ที่ไม่ส่งมาจะใช้ค่าเดิม
 * variants — Smart Upsert: UPDATE type เดิม / INSERT type ใหม่ / DELETE type ที่หายไป
 *            ถ้าพยายามลบ variant ที่มี order อ้างอิง → 409 Conflict
 */
const updateBook = async (req, res) => {
    const id   = req.params.id;
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;

    const conn = await db.getConnection();

    // เก็บ URL รูปใหม่ที่ upload สำเร็จแล้ว เพื่อลบออกหาก DB ล้มเหลวทีหลัง
    let newCoverUrl = null;

    try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT * FROM books WHERE id = ?', [id]);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการแก้ไข' });
        }
        const old = existing[0];

        // อัพโหลดรูปใหม่ไปยัง Cloudinary (ถ้ามีไฟล์ใหม่)
        let cover_image_url = old.cover_image_url;
        if (req.file) {
            newCoverUrl     = await uploadToCloudinary(req.file.buffer);
            cover_image_url = newCoverUrl;
        }

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

        if (req.body.variants) {
            let variants = [];
            try {
                variants = JSON.parse(req.body.variants);
            } catch {
                await conn.rollback();
                if (newCoverUrl) await deleteFromCloudinary(newCoverUrl);
                return res.status(400).json({ message: 'รูปแบบ variants ไม่ถูกต้อง' });
            }

            const [currentVariants] = await conn.query(
                'SELECT id, type FROM book_variants WHERE book_id = ?',
                [id]
            );
            const currentTypeMap = new Map(currentVariants.map((v) => [v.type, v.id]));
            const newTypes       = new Set(variants.map((v) => v.type));

            // ลบ variant ที่ไม่อยู่ในชุดใหม่ — ถ้ามี order อ้างอิงอยู่ให้ return 409
            for (const cv of currentVariants) {
                if (!newTypes.has(cv.type)) {
                    const [[{ count }]] = await conn.query(
                        'SELECT COUNT(*) AS count FROM order_items WHERE variant_id = ?',
                        [cv.id]
                    );
                    if (count > 0) {
                        await conn.rollback();
                        if (newCoverUrl) await deleteFromCloudinary(newCoverUrl);
                        return res.status(409).json({
                            message: `ไม่สามารถลบ variant "${cv.type}" ได้ เนื่องจากมีคำสั่งซื้อที่อ้างอิงอยู่`,
                        });
                    }
                    await conn.query('DELETE FROM book_variants WHERE id = ?', [cv.id]);
                }
            }

            // Upsert: UPDATE type เดิม / INSERT type ใหม่
            for (const v of variants) {
                const stock = v.type === 'ebook' ? (v.stock ?? null) : v.stock;
                if (currentTypeMap.has(v.type)) {
                    await conn.query(
                        'UPDATE book_variants SET price = ?, stock = ? WHERE id = ?',
                        [v.price, stock, currentTypeMap.get(v.type)]
                    );
                } else {
                    await conn.query(
                        'INSERT INTO book_variants (book_id, type, price, stock) VALUES (?, ?, ?, ?)',
                        [id, v.type, v.price, stock]
                    );
                }
            }
        }

        await conn.commit();

        // Commit สำเร็จแล้ว → ลบรูปเก่าออกจาก Cloudinary (ถ้ามีรูปใหม่เข้ามาแทนที่)
        if (newCoverUrl && old.cover_image_url) {
            await deleteFromCloudinary(old.cover_image_url);
        }

        const [updated] = await conn.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [id]
        );
        updated[0].variants = await getVariants(id);

        res.status(200).json({ message: 'แก้ไขข้อมูลหนังสือสำเร็จ', book: updated[0] });
    } catch (error) {
        await conn.rollback();
        // DB ล้มเหลวหลัง upload สำเร็จแล้ว → ลบรูปใหม่ออกจาก Cloudinary ไม่ให้ค้างไว้
        if (newCoverUrl) await deleteFromCloudinary(newCoverUrl);
        console.error('Update book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลหนังสือ' });
    } finally {
        conn.release();
    }
};

// ─── Delete Book (Soft Delete) ────────────────────────────────────────────────

/**
 * @route  DELETE /api/books/:id
 * @access Admin
 *
 * Soft Delete — ตั้ง is_active = 0 แทนการลบจริง
 * เพื่อรักษา order history ไว้ (order_items.variant_id มี ON DELETE RESTRICT)
 */
const deleteBook = async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query(
            'UPDATE books SET is_active = 0 WHERE id = ? AND is_active = 1',
            [id]
        );

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
