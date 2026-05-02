const express = require('express');
const router = express.Router();
const { getBooks, getBookById, addBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// --- Public Routes ---
router.get('/', getBooks);
router.get('/:id', getBookById);

// --- Admin Routes (Protected) ---
router.post('/', protect, adminOnly, addBook);
router.put('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
