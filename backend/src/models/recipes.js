// backend/src/routes/recipes.js
// Recipe Routes - Maps to Products (Recipes = Products with instructions)

const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/recipes
 * @desc    Get all recipes
 * @access  Private
 */
router.get('/', recipeController.getAllRecipes);

/**
 * @route   GET /api/v1/recipes/:id
 * @desc    Get single recipe
 * @access  Private
 */
router.get('/:id', recipeController.getRecipe);

/**
 * @route   POST /api/v1/recipes
 * @desc    Create new recipe
 * @access  Private (admin/manager)
 */
router.post('/', recipeController.createRecipe);

/**
 * @route   PUT /api/v1/recipes/:id
 * @desc    Update recipe
 * @access  Private (admin/manager)
 */
router.put('/:id', recipeController.updateRecipe);

/**
 * @route   DELETE /api/v1/recipes/:id
 * @desc    Delete recipe
 * @access  Private (admin)
 */
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;