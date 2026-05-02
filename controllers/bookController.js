const db = require('../config/db');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
    try {
        const [books] = await db.query('SELECT * FROM books');
        res.status(200).json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์' });
    }
};

// @desc    Get book detail 
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        const id = req.params.id;
        const [book] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
        res.status(200).json(book[0]);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์' });
    }
};

// --- Admin Actions ---

// @desc    Add a new book
// @route   POST /api/books
// @access  Private (Admin Only)
const addBook = async (req, res) => {
    const { title, author, price, cover, category, description, stock } = req.body;

    if (!title || !author || !price) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูล title, author และ price ให้ครบถ้วน' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO books (title, author, price, cover, category, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, author, price, cover, category, description, stock || 0]
        );

        res.status(201).json({
            message: 'เพิ่มหนังสือเรียบร้อยแล้ว',
            bookId: result.insertId
        });
    } catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหนังสือ' });
    }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private (Admin Only)
const updateBook = async (req, res) => {
    const id = req.params.id;
    const { title, author, price, cover, category, description, stock } = req.body;

    try {
        // เช็คก่อนว่ามีหนังสือไหม
        const [existing] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการแก้ไข' });
        }

        await db.query(
            'UPDATE books SET title = ?, author = ?, price = ?, cover = ?, category = ?, description = ?, stock = ? WHERE id = ?',
            [title || existing[0].title, author || existing[0].author, price || existing[0].price, cover || existing[0].cover, category || existing[0].category, description || existing[0].description, stock !== undefined ? stock : existing[0].stock, id]
        );

        res.json({ message: 'แก้ไขข้อมูลหนังสือเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลหนังสือ' });
    }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private (Admin Only)
const deleteBook = async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหนังสือที่ต้องการลบ' });
        }

        res.json({ message: 'ลบหนังสือเรียบร้อยแล้ว' });
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
    deleteBook
};
