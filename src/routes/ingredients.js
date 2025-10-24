// backend/src/routes/ingredients.js
const express = require('express');
const {
  getIngredients,      // ← WICHTIG: getIngredients NICHT getAllIngredients
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  updateStock,
  getLowStock
} = require('../controllers/ingredientController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Special routes first
router.get('/low-stock', protect, authorize('admin', 'manager'), getLowStock);

// CRUD routes
router.get('/', protect, getIngredients);  // ← HIER: getIngredients
router.get('/:id', protect, getIngredient);
router.post('/', protect, authorize('admin', 'manager'), createIngredient);
router.put('/:id', protect, authorize('admin', 'manager'), updateIngredient);
router.delete('/:id', protect, authorize('admin'), deleteIngredient);

// Stock management
router.patch('/:id/stock', protect, authorize('admin', 'manager'), updateStock);

module.exports = router;