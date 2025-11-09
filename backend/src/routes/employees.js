/**
 * 👥 routes/employees.js - UNIFIED EMPLOYEE ROUTES
 * Konsistent mit Vue Frontend: /employees/:employeeId/*
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import controllers
const employeeController = require('../controllers/employeeController');

// Import route modules that will be nested under /employees
const availabilityRoutes = require('./employee/availability');
const patternRoutes = require('./employee/patterns');

// =======================================
// 👤 BASIC EMPLOYEE ROUTES
// =======================================

// GET /api/v1/employees
router.get('/', protect, employeeController.getEmployees);

// POST /api/v1/employees  
router.post('/', protect, authorize('admin', 'manager'), employeeController.createEmployee);

// GET /api/v1/employees/analytics
router.get('/analytics', protect, employeeController.getEmployeesAnalytics);

// GET /api/v1/employees/available (for specific shift)
router.get('/available', protect, employeeController.getAvailableEmployees);

// GET /api/v1/employees/top-performers
router.get('/top-performers', protect, employeeController.getTopPerformers);

// GET /api/v1/employees/:id
router.get('/:id', protect, employeeController.getEmployee);

// PUT /api/v1/employees/:id
router.put('/:id', protect, authorize('admin', 'manager'), employeeController.updateEmployee);

// DELETE /api/v1/employees/:id  
router.delete('/:id', protect, authorize('admin'), employeeController.deleteEmployee);

// PUT /api/v1/employees/:id/availability-settings
router.put('/:id/availability-settings', protect, employeeController.updateAvailability);

// =======================================
// 📅 NESTED AVAILABILITY ROUTES
// =======================================

// Mount availability routes under /employees/:employeeId/
// Diese Routes matchen deine Vue-App perfekt!
router.use('/:employeeId/availability', availabilityRoutes);

// Mount pattern routes under /employees/:employeeId/
router.use('/:employeeId', patternRoutes);

module.exports = router;