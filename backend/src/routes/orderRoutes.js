const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  listAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const authenticateToken = require('../middlewares/authMiddleware');
const authorizeAdmin = require('../middlewares/adminMiddleware');

router.post('/', authenticateToken, createOrder);
router.post('/checkout', authenticateToken, createOrder);

router.get('/my-orders', authenticateToken, getMyOrders);

// Admin: list all orders
router.get('/', authenticateToken, authorizeAdmin, listAllOrders);

// Retrieve a specific order by id (admin or owner)
router.get('/:id', authenticateToken, getOrderById);

// Admin: update order status
router.put('/:id/status', authenticateToken, authorizeAdmin, updateOrderStatus);

// Cancel order (customer). REST semantics: DELETE signals cancellation
router.delete('/:id/cancel', authenticateToken, cancelOrder);

module.exports = router;