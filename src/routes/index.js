const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const salesRoutes = require('./sales');
const ingredientRoutes = require('./ingredients');
const recipeRoutes = require('./recipes');
const categoryRoutes = require('./categories');
const forecastRoutes = require('./forecasts');  // ⬅️ NEU!

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/sales', salesRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);
router.use('/categories', categoryRoutes);
router.use('/forecasts', forecastRoutes);  // ⬅️ NEU!

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Restaurant API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      sales: '/api/v1/sales',
      ingredients: '/api/v1/ingredients',
      recipes: '/api/v1/recipes',
      categories: '/api/v1/categories',
      forecasts: '/api/v1/forecasts'  // ⬅️ NEU!
    }
  });
});

module.exports = router;