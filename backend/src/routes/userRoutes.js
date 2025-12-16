const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

// Get the authenticated user's profile
router.get('/me', authenticateToken, getProfile);

module.exports = router;