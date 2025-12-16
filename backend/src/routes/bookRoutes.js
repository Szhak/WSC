const express = require('express');
const router = express.Router();
const {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooksFromGoogle
} = require('../controllers/bookController');
const authenticateToken = require('../middlewares/authMiddleware');
const authorizeAdmin = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/search', searchBooksFromGoogle);
router.get('/', listBooks);
router.get('/:id', getBookById);

router.post('/', authenticateToken, authorizeAdmin, upload.single('cover'), createBook);

router.put('/:id', authenticateToken, authorizeAdmin, upload.single('cover'), updateBook);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteBook);

module.exports = router;