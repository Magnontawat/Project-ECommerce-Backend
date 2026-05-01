const db = require('../config/db');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
    try {
        // ใช้คำสั่ง SQL ดึงข้อมูลหนังสือทั้งหมดจากตาราง books
        const [books] = await db.query('SELECT * FROM books');

        // ส่งข้อมูลกลับไปในรูปแบบ JSON (Array)
        res.status(200).json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์' });
    }
};

// @desc    Get book detail 
// @route   POST /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
    try {
        // ดึงค่า id จาก URL parameters (เช่น /api/books/1)
        const id = req.params.id;
        const [book] = await db.query('SELECT * FROM books WHERE id = ?', [id]);
        res.status(200).json(book[0]);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือจากเซิร์ฟเวอร์' });
    }
};

module.exports = {
    getBooks,
    getBookById
};
