// backend/src/routes/ingredients.js
// Ingredient Routes

const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/ingredients
 * @desc    Get all ingredients
 * @access  Private
 */
router.get('/', ingredientController.getAllIngredients);

/**
 * @route   GET /api/v1/ingredients/low-stock
 * @desc    Get low stock ingredients
 * @access  Private
 */
router.get('/low-stock', ingredientController.getLowStockIngredients);

/**
 * @route   GET /api/v1/ingredients/:id
 * @desc    Get single ingredient
 * @access  Private
 */
router.get('/:id', ingredientController.getIngredient);

/**
 * @route   POST /api/v1/ingredients
 * @desc    Create new ingredient
 * @access  Private (admin/manager)
 */
router.post('/', ingredientController.createIngredient);

/**
 * @route   POST /api/v1/ingredients/bulk-delete
 * @desc    Bulk delete ingredients
 * @access  Private (admin)
 */
router.post('/bulk-delete', ingredientController.bulkDeleteIngredients);

/**
 * @route   PUT /api/v1/ingredients/:id
 * @desc    Update ingredient
 * @access  Private (admin/manager)
 */
router.put('/:id', ingredientController.updateIngredient);

/**
 * @route   DELETE /api/v1/ingredients/:id
 * @desc    Delete ingredient
 * @access  Private (admin)
 */
router.delete('/:id', ingredientController.deleteIngredient);

module.exports = router;