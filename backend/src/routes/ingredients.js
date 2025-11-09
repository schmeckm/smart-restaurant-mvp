// backend/src/routes/ingredients.js
// Ingredient Routes

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getLowStockIngredients,
  updateStock,
  getIngredientNutrition
} = require('../controllers/ingredientController');

// Alle Routen erfordern Authentifizierung
router.use(protect);

/**
 * @route   GET /api/v1/ingredients
 * @desc    Get all ingredients
 * @access  Private
 */
router.get('/', getAllIngredients);

/**
 * @route   GET /api/v1/ingredients/low-stock
 * @desc    Get low stock ingredients
 * @access  Private
 */
router.get('/low-stock', getLowStockIngredients);

/**
 * @route   GET /api/v1/ingredients/:id/nutrition
 * @desc    Lazy load Nutrition data for ingredient
 * @access  Private
 */
router.get('/:id/nutrition', getIngredientNutrition);

/**
 * @route   GET /api/v1/ingredients/:id
 * @desc    Get single ingredient
 * @access  Private
 */
router.get('/:id', getIngredient);

/**
 * @route   POST /api/v1/ingredients
 * @desc    Create new ingredient
 * @access  Private (admin/manager)
 */
router.post('/', createIngredient);

/**
 * @route   PUT /api/v1/ingredients/:id
 * @desc    Update ingredient
 * @access  Private (admin/manager)
 */
router.put('/:id', updateIngredient);

/**
 * @route   PATCH /api/v1/ingredients/:id/stock
 * @desc    Update ingredient stock
 * @access  Private (admin/manager)
 */
router.patch('/:id/stock', updateStock);

/**
 * @route   DELETE /api/v1/ingredients/:id
 * @desc    Delete ingredient
 * @access  Private (admin)
 */
router.delete('/:id', deleteIngredient);

module.exports = router;
