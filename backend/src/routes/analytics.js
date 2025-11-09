// backend/src/routes/analytics.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); 
const controller = require('../controllers/analyticsController');

// 📊 Statistiken & Auswertungen
router.get('/today', protect, controller.getTodayAnalytics);
router.get('/daily', protect, controller.getDailySales);
router.get('/top-products', protect, controller.getTopProducts);
router.get('/low-stock', protect, controller.getLowStockIngredients);

// 💰 Financial Insights (NEU hinzufügen)
router.get('/profitability', protect, controller.getProductProfitability);
router.get('/financial-overview', protect, controller.getFinancialOverview);

module.exports = router;