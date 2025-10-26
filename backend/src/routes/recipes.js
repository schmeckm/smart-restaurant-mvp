// backend/src/routes/recipes.js
// Complete Recipe Routes with AI Integration

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recipeController = require('../controllers/recipeController');
const aiRecipeController = require('../controllers/aiRecipeController');

// All routes require authentication
router.use(protect);

// ==========================================
// AI RECIPE ROUTES (MUST BE FIRST!)
// ==========================================

/**
 * @route   POST /api/v1/recipes/generate-with-ai
 * @desc    Generate recipe using AI intelligence
 * @access  Private
 */
router.post('/generate-with-ai', aiRecipeController.generateRecipeWithAI);

/**
 * @route   POST /api/v1/recipes/save-ai-recipe
 * @desc    Save complete AI-generated recipe with ingredients to database
 * @access  Private
 */
router.post('/save-ai-recipe', aiRecipeController.saveAIRecipe);

/**
 * @route   POST /api/v1/recipes/analyze-nutrition
 * @desc    Analyze nutritional values for ingredients
 * @access  Private
 */
router.post('/analyze-nutrition', aiRecipeController.analyzeNutrition);

/**
 * @route   POST /api/v1/recipes/suggest-ingredients
 * @desc    Get smart ingredient suggestions
 * @access  Private
 */
router.post('/suggest-ingredients', aiRecipeController.suggestIngredients);

// ==========================================
// STANDARD RECIPE ROUTES
// ==========================================

/**
 * @route   GET /api/v1/recipes
 * @desc    Get all recipes (products with instructions)
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
 * @access  Private
 */
router.post('/', recipeController.createRecipe);

/**
 * @route   PUT /api/v1/recipes/:id
 * @desc    Update recipe
 * @access  Private
 */
router.put('/:id', recipeController.updateRecipe);

/**
 * @route   DELETE /api/v1/recipes/:id
 * @desc    Delete recipe
 * @access  Private
 */
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;