const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const authenticateToken = require('../middlewares/authMiddleware');
const authorizeAdmin = require('../middlewares/adminMiddleware');


router.get('/', getCategories);

router.post('/', authenticateToken, authorizeAdmin, createCategory);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteCategory);


module.exports = router;