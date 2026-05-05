const db = require('../config/db');

// Helper: ดึง variants ของหนังสือ
const getVariants = async (bookId) => {
    const [variants] = await db.query(
        'SELECT id, book_id, type, price, stock FROM book_variants WHERE book_id = ? ORDER BY FIELD(type, "th", "en", "ebook")',
        [bookId]
    );
    return variants;
};

// Helper: สร้าง cover_image_url จาก uploaded file
const buildCoverUrl = (req) => {
    if (req.file) {
        return `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;
    }
    return null;
};

// =============================================
// @desc    Get all books (พร้อม variants)
// @route   GET /api/books
// @access  Public
// =============================================
const getBooks = async (req, res) => {
    try {
        const [books] = await db.query(
            `SELECT b.id, b.title, b.author, b.publisher, b.publish_year,
                    b.genre, b.synopsis, b.cover_image_url, b.created_at
             FROM books b
             ORDER BY b.created_at DESC`
        );

        // แนบ variants เข้าแต่ละ book
        const booksWithVariants = await Promise.all(
            books.map(async (book) => ({
                ...book,
                variants: await getVariants(book.id),
            }))
        );

        res.status(200).json(booksWithVariants);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// =============================================
// @desc    Get book by ID (พร้อม variants)
// @route   GET /api/books/:id
// @access  Public
// =============================================
const getBookById = async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.query(
            `SELECT id, title, author, publisher, publish_year,
                    genre, synopsis, cover_image_url, created_at
             FROM books WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการ' });
        }

        const book = rows[0];
        book.variants = await getVariants(book.id);

        res.status(200).json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' });
    }
};

// =============================================
// @desc    Add a new book + variants
// @route   POST /api/books
// @access  Private (Admin Only)
// Content-Type: multipart/form-data
// =============================================
const addBook = async (req, res) => {
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;
    const cover_image_url = buildCoverUrl(req);

    // Validate required fields
    if (!title || !author || !genre) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ (title, author, genre)' });
    }

    // Parse variants
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
    const typesSeen = new Set();
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

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Insert book
        const [bookResult] = await conn.query(
            `INSERT INTO books (title, author, publisher, publish_year, genre, synopsis, cover_image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, author, publisher || null, publish_year || null, genre, synopsis || null, cover_image_url]
        );
        const bookId = bookResult.insertId;

        // Insert variants
        const variantRows = variants.map((v) => [bookId, v.type, v.price, v.stock ?? 0]);
        await conn.query(
            'INSERT INTO book_variants (book_id, type, price, stock) VALUES ?',
            [variantRows]
        );

        await conn.commit();

        // ดึงข้อมูลที่ insert ไปแล้วส่งกลับ
        const [newBook] = await conn.query(
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
        await conn.rollback();
        console.error('Add book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหนังสือ' });
    } finally {
        conn.release();
    }
};

// =============================================
// @desc    Update book + variants
// @route   PUT /api/books/:id
// @access  Private (Admin Only)
// Content-Type: multipart/form-data
// =============================================
const updateBook = async (req, res) => {
    const id = req.params.id;
    const { title, author, publisher, publish_year, genre, synopsis } = req.body;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // ตรวจสอบว่ามีหนังสือหรือเปล่า
        const [existing] = await conn.query('SELECT * FROM books WHERE id = ?', [id]);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการแก้ไข' });
        }
        const old = existing[0];

        // cover_image_url: ใช้ของใหม่ถ้ามีการอัพโหลด มิฉะนั้นใช้ของเดิม
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
                title || old.title,
                author || old.author,
                publisher !== undefined ? publisher : old.publisher,
                publish_year !== undefined ? publish_year : old.publish_year,
                genre || old.genre,
                synopsis !== undefined ? synopsis : old.synopsis,
                cover_image_url,
                id,
            ]
        );

        // อัพเดต variants ถ้ามีส่งมา
        if (req.body.variants) {
            let variants = [];
            try {
                variants = JSON.parse(req.body.variants);
            } catch {
                await conn.rollback();
                return res.status(400).json({ message: 'รูปแบบ variants ไม่ถูกต้อง' });
            }

            // ลบ variants เดิมแล้วใส่ใหม่ทั้งหมด
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

        // ดึงข้อมูลที่อัพเดตแล้วส่งกลับ
        const [updated] = await conn.query(
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

// =============================================
// @desc    Delete a book (variants จะถูกลบ cascade)
// @route   DELETE /api/books/:id
// @access  Private (Admin Only)
// =============================================
const deleteBook = async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการลบ' });
        }
        res.status(200).json({ message: 'ลบหนังสือสำเร็จ' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหนังสือ' });
    }
};

module.exports = {
    getBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
};
