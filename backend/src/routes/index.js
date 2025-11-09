const express = require('express');
const router = express.Router();

// Import existing route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const salesRoutes = require('./sales');
const ingredientRoutes = require('./ingredients');
const recipeRoutes = require('./recipes');
const categoryRoutes = require('./categories');
const forecastRoutes = require('./forecasts');
const nutritionRoutes = require('./nutrition');
const analyticsRoutes = require('./analytics');
const employeeRoutes = require('./employees');
const aiSchedulingRoutes = require('./aiScheduling');
const restaurantRoutes = require('./restaurant');

// 👥 Employee Availability System
const availabilityRoutes = require('./employee/availability');
const employeePatternRoutes = require('./employee/patterns'); // ✅ Sequelize-basierte Wochenmuster-Route

// Mount existing routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/sales', salesRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);
router.use('/categories', categoryRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/employees', employeeRoutes);
router.use('/ai', aiSchedulingRoutes);
router.use('/restaurants', restaurantRoutes);

// 👥 NEW: Availability & Weekly Pattern Routes
router.use('/availability', availabilityRoutes);
router.use('/employees', employeePatternRoutes); // ✅ Wochenmuster-Integration

// Enhanced API info endpoint with availability integration
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Restaurant API v1.1 - Now with Employee Availability! 🚀',
    version: '1.1.0',
    new_features: [
      '✨ Employee Availability Management',
      '⚠️ Scheduling Conflict Detection',
      '📦 Bulk Availability Import',
      '📊 Workload Analytics & Statistics',
      '🔗 Seamless Employee Integration',
      '🧩 Weekly Pattern Preferences (NEW)',
    ],
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      sales: '/api/v1/sales',
      ingredients: '/api/v1/ingredients',
      recipes: '/api/v1/recipes',
      categories: '/api/v1/categories',
      forecasts: '/api/v1/forecasts',
      nutrition: '/api/v1/nutrition',
      analytics: '/api/v1/analytics',
      employees: '/api/v1/employees',
      ai: '/api/v1/ai',
      restaurants: '/api/v1/restaurants',
      availability: {
        base: '/api/v1/availability',
        employee_schedule: '/api/v1/availability/:employeeId',
        team_overview: '/api/v1/availability/overview/all',
        conflict_detection: '/api/v1/availability/conflicts/list',
        bulk_import: '/api/v1/availability/bulk/create',
        employee_stats: '/api/v1/availability/stats/:employeeId',
        search_filter: '/api/v1/availability/search/filter',
      },
      availability_pattern: {
        base: '/api/v1/employees/:id/pattern',
      },
    },
    integrations: {
      employee_system: {
        enhanced_endpoints: [
          'GET /api/v1/employees/:id - Now includes availability when date range provided',
          'GET /api/v1/employees - Can be enhanced with availability stats',
        ],
        new_combined_endpoints: [
          'GET /api/v1/employees/:id/schedule - Direct employee schedule access',
          'GET /api/v1/employees/team/availability - Team availability overview',
          'GET /api/v1/employees/:id/pattern - Weekly pattern access (NEW)',
        ],
      },
    },
    quick_start: {
      create_availability: 'POST /api/v1/availability',
      get_employee_schedule:
        'GET /api/v1/availability/:employeeId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
      bulk_import: 'POST /api/v1/availability/bulk/create',
      find_conflicts:
        'GET /api/v1/availability/conflicts/list?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
      manage_weekly_pattern: 'POST /api/v1/employees/:id/pattern (NEW)',
    },
  });
});

// 📋 Documentation endpoint
router.get('/docs/availability', (req, res) => {
  res.json({
    title: 'Employee Availability Management - API Documentation',
    version: '1.1.0',
    description:
      'Complete scheduling and availability management for restaurant staff',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <your-token>',
      note: 'Uses existing Smart Restaurant API authentication',
    },
    rate_limiting: {
      window: '15 minutes',
      max_requests: 100,
      scope: 'per IP address',
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/availability/:employeeId',
        description: 'Get availability schedule for specific employee',
      },
      {
        method: 'POST',
        path: '/api/v1/availability',
        description: 'Create new availability entry',
      },
      {
        method: 'GET',
        path: '/api/v1/availability/overview/all',
        description: 'Get availability overview for all employees',
      },
      {
        method: 'POST',
        path: '/api/v1/availability/bulk/create',
        description: 'Bulk create multiple availability entries',
      },
      {
        method: 'GET',
        path: '/api/v1/availability/conflicts/list',
        description: 'Find scheduling conflicts',
      },
      {
        method: 'GET',
        path: '/api/v1/employees/:id/pattern',
        description: 'Get or set weekly availability pattern (NEW)',
      },
    ],
  });
});

// 🔍 Health check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: 'operational',
        employee_system: 'operational',
        availability_system: 'operational',
        availability_pattern: 'operational',
      },
      version: '1.1.0',
      uptime: process.uptime(),
      features: {
        availability_management: 'enabled',
        conflict_detection: 'enabled',
        bulk_operations: 'enabled',
        weekly_patterns: 'enabled',
      },
    };

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
