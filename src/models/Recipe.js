// backend/routes/recipes.js - TEMPORARY EMPTY RECIPE API
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ==========================================
// TEMPORARY RECIPE ROUTES (Empty Data)
// ==========================================
// These return empty data until Recipe models are fixed

/**
 * @route   GET /api/v1/recipes
 * @desc    Get all recipes (TEMPORARY - returns empty)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log('⚠️ Recipe API called - returning empty data (Recipe models disabled)');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total: 0,
        pages: 0
      },
      message: 'Recipe system is being updated. Please check back later.'
    });
    
  } catch (error) {
    console.error('Recipe fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe system temporarily unavailable',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/recipes/:id
 * @desc    Get recipe by ID (TEMPORARY - returns not found)
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`⚠️ Recipe ${req.params.id} requested - returning not found (Recipe models disabled)`);
    
    res.status(404).json({
      success: false,
      message: 'Recipe system is being updated. Individual recipes not available.',
      data: null
    });
    
  } catch (error) {
    console.error('Recipe fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe system temporarily unavailable',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/recipes
 * @desc    Create recipe (TEMPORARY - returns not implemented)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    console.log('⚠️ Recipe creation attempted - returning not implemented (Recipe models disabled)');
    
    res.status(501).json({
      success: false,
      message: 'Recipe creation is temporarily disabled while the system is being updated.',
      data: null
    });
    
  } catch (error) {
    console.error('Recipe creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe system temporarily unavailable',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/recipes/:id
 * @desc    Update recipe (TEMPORARY - returns not implemented)
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    console.log(`⚠️ Recipe ${req.params.id} update attempted - returning not implemented (Recipe models disabled)`);
    
    res.status(501).json({
      success: false,
      message: 'Recipe updates are temporarily disabled while the system is being updated.',
      data: null
    });
    
  } catch (error) {
    console.error('Recipe update error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe system temporarily unavailable',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/recipes/:id
 * @desc    Delete recipe (TEMPORARY - returns not implemented)
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`⚠️ Recipe ${req.params.id} deletion attempted - returning not implemented (Recipe models disabled)`);
    
    res.status(501).json({
      success: false,
      message: 'Recipe deletion is temporarily disabled while the system is being updated.',
      data: null
    });
    
  } catch (error) {
    console.error('Recipe deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe system temporarily unavailable',
      error: error.message
    });
  }
});

module.exports = router;