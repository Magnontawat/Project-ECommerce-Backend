/**
 * controllers/bookController.js
 *
 * getBooks    — ดึงหนังสือทั้งหมด         (GET    /api/books)
 * getBookById — ดึงหนังสือตาม ID           (GET    /api/books/:id)
 * addBook     — เพิ่มหนังสือใหม่ (Admin)   (POST   /api/books)
 * updateBook  — แก้ไขหนังสือ (Admin)       (PUT    /api/books/:id)
 * deleteBook  — ลบหนังสือ (Admin)           (DELETE /api/books/:id)
 */

const db = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ดึง variants ของหนังสือ เรียงลำดับ th → en → ebook เสมอ
const getVariants = async (bookId) => {
    const [variants] = await db.query(
        'SELECT id, book_id, type, price, stock FROM book_variants WHERE book_id = ? ORDER BY FIELD(type, "th", "en", "ebook")',
        [bookId]
    );
    return variants;
};

// สร้าง URL รูปปกจากไฟล์ที่ Multer อัพโหลด
const buildCoverUrl = (req) => {
    if (req.file) {
        return `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;
    }
    return null;
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
    const cover_image_url = buildCoverUrl(req);

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
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT * FROM books WHERE id = ?', [id]);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการแก้ไข' });
        }
        const old = existing[0];

        const cover_image_url = req.file ? buildCoverUrl(req) : old.cover_image_url;

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
