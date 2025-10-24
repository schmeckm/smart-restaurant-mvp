const express = require('express');
const {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getSalesAnalytics,
  getTopProducts,
  getDailySales
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Analytics routes (before /:id to avoid conflicts)
router.get('/analytics', protect, authorize('admin', 'manager'), getSalesAnalytics);
router.get('/top-products', protect, authorize('admin', 'manager'), getTopProducts);
router.get('/daily', protect, authorize('admin', 'manager'), getDailySales);

// CRUD routes
router.get('/', protect, getSales);
router.get('/:id', protect, getSale);
router.post('/', protect, createSale);
router.put('/:id', protect, authorize('admin', 'manager'), updateSale);  // ⬅️ NEU!
router.delete('/:id', protect, authorize('admin'), deleteSale);  // ⬅️ NEU!

module.exports = router;