/**
 * 🛣️ Employee Availability Routes
 * Express.js routes for employee availability management
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');

/**
 * 🔧 Middleware Functions
 */

// Request validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Request logging middleware
const logRequest = (req, res, next) => {
  console.log(`📍 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
};

// Rate limiting (simple implementation)
const rateLimit = (windowMs, max) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const requestTimes = requests.get(key).filter(time => time > windowStart);
    
    if (requestTimes.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requestTimes.push(now);
    requests.set(key, requestTimes);
    next();
  };
};

/**
 * 📋 Validation Rules
 */

const validateEmployeeId = [
  param('employeeId')
    .isInt({ min: 1 })
    .withMessage('Employee ID muss eine positive Zahl sein')
];

const validateAvailabilityId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Availability ID muss eine positive Zahl sein')
];

const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date muss im Format YYYY-MM-DD sein'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date muss im Format YYYY-MM-DD sein')
];

const validateCreateAvailability = [
body('employee_id')
  .isUUID()
  .withMessage('employee_id muss eine gültige UUID sein')
  body('date')
    .isISO8601()
    .withMessage('date muss im Format YYYY-MM-DD sein'),
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time muss im Format HH:MM oder HH:MM:SS sein'),
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time muss im Format HH:MM oder HH:MM:SS sein'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available muss true oder false sein'),
  body('availability_type')
    .optional()
    .isIn(['working', 'vacation', 'sick', 'break', 'meeting', 'unavailable'])
    .withMessage('availability_type muss einer der erlaubten Werte sein'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('notes darf maximal 500 Zeichen lang sein')
];

const validateUpdateAvailability = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('date muss im Format YYYY-MM-DD sein'),
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time muss im Format HH:MM oder HH:MM:SS sein'),
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time muss im Format HH:MM oder HH:MM:SS sein'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available muss true oder false sein'),
  body('availability_type')
    .optional()
    .isIn(['working', 'vacation', 'sick', 'break', 'meeting', 'unavailable'])
    .withMessage('availability_type muss einer der erlaubten Werte sein'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('notes darf maximal 500 Zeichen lang sein')
];

const validateBulkAvailability = [
  body('employee_id')
    .isUUID()
    .withMessage('employee_id muss eine gültige UUID sein'),
  body('availability_entries')
    .isArray({ min: 0, max: 100 })  // ✅ GEÄNDERT: min: 0 statt min: 1
    .withMessage('availability_entries muss ein Array mit 0-100 Einträgen sein'),
  body('availability_entries.*.date')
    .isISO8601()
    .withMessage('Jeder Eintrag muss ein gültiges Datum haben'),
  body('availability_entries.*.start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('start_time muss im Format HH:MM oder HH:MM:SS sein'),
  body('availability_entries.*.end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('end_time muss im Format HH:MM oder HH:MM:SS sein')
];
/**
 * 🔐 Authentication Middleware (Placeholder)
 * Replace with your actual authentication system
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  // TODO: Implement actual token validation
  // For now, just check if header exists
  if (authHeader.startsWith('Bearer ')) {
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format'
    });
  }
};

/**
 * 🛣️ Route Definitions
 */

function createAvailabilityRoutes(controller) {
  // Apply middleware to all routes
  router.use(logRequest);
  router.use(rateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes

  /**
   * 📅 GET /api/v1/availability/:employeeId
   * Get availability for specific employee
   */
  router.get(
    '/:employeeId',
    requireAuth,
    validateEmployeeId,
    validateDateRange,
    handleValidationErrors,
    async (req, res) => {
      try {
        await controller.getEmployeeAvailability(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * ➕ POST /api/v1/availability
   * Create new availability entry
   */
  router.post(
    '/',
    requireAuth,
    validateCreateAvailability,
    handleValidationErrors,
    async (req, res) => {
      try {
        await controller.createAvailability(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * ✏️ PUT /api/v1/availability/:id
   * Update existing availability
   */

  router.put(
  '/:id',
  requireAuth,
  validateAvailabilityId,
  validateUpdateAvailability,
  handleValidationErrors,
  async (req, res) => {
    // ✅ DIREKTE IMPLEMENTIERUNG statt Controller-Call
    try {
      const { id } = req.params;
      const {
        start_time,
        end_time,
        availability_type,
        is_available,
        notes
      } = req.body;

      // TODO: Replace with your actual database pool/connection
      const { pool } = require('../../config/pgPool'); // Adjust path as needed
      const client = await pool.connect();
      
      try {
        // Validierung
        if (!start_time || !end_time) {
          return res.status(400).json({
            success: false,
            error: 'start_time und end_time sind erforderlich'
          });
        }

        // Update SQL
        const updateQuery = `
          UPDATE employee_availability 
          SET 
            start_time = $1,
            end_time = $2,
            availability_type = $3,
            is_available = $4,
            notes = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING *
        `;

        const result = await client.query(updateQuery, [
          start_time,
          end_time,
          availability_type || 'working',
          is_available !== undefined ? is_available : true,
          notes || '',
          id
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Verfügbarkeit nicht gefunden'
          });
        }

        console.log('✅ Verfügbarkeit aktualisiert:', result.rows[0]);

        res.json({
          success: true,
          message: 'Verfügbarkeit erfolgreich aktualisiert',
          data: result.rows[0]
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Update Fehler:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);
  /**
   * 🗑️ DELETE /api/v1/availability/:id
   * Delete availability entry
   */

  router.delete(
  '/:id',
  requireAuth,
  validateAvailabilityId,
  handleValidationErrors,
  async (req, res) => {
    // ✅ DIREKTE IMPLEMENTIERUNG statt Controller-Call
    try {
      const { id } = req.params;

      // TODO: Replace with your actual database pool/connection
      const { pool } = require('../../config/pgPool'); // Adjust path as needed
      const client = await pool.connect();
      
      try {
        const deleteQuery = 'DELETE FROM employee_availability WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Verfügbarkeit nicht gefunden'
          });
        }

        console.log('✅ Verfügbarkeit gelöscht:', result.rows[0]);

        res.json({
          success: true,
          message: 'Verfügbarkeit erfolgreich gelöscht',
          data: result.rows[0]
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Delete Fehler:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

  /**
   * 📊 GET /api/v1/availability/overview
   * Get availability overview for all employees
   */
  router.get(
    '/overview/all',  // Changed path to avoid conflict with /:employeeId
    requireAuth,
    validateDateRange,
    handleValidationErrors,
    async (req, res) => {
      try {
        await controller.getAvailabilityOverview(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * 📋 GET /api/v1/availability/conflicts
   * Get scheduling conflicts
   */
  router.get(
    '/conflicts/list',  // Changed path to avoid conflict
    requireAuth,
    validateDateRange,
    handleValidationErrors,
    async (req, res) => {
      try {
        await controller.getAvailabilityConflicts(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * 📅 POST /api/v1/availability/bulk
   * Create multiple availability entries
   */
  router.post(
    '/bulk/create',  // Changed path to avoid conflict
    requireAuth,
    validateBulkAvailability,
    handleValidationErrors,
    async (req, res) => {
      try {
        await controller.createBulkAvailability(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * 📈 GET /api/v1/availability/stats/:employeeId
   * Get employee workload statistics
   */
  router.get(
    '/stats/:employeeId',
    requireAuth,
    validateEmployeeId,
    validateDateRange,
    handleValidationErrors,
    async (req, res) => {
      try {
        const { employeeId } = req.params;
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
          return res.status(400).json({
            success: false,
            message: 'start_date und end_date sind erforderlich'
          });
        }

        // This would need to be implemented in the controller
        // For now, return a placeholder response
        res.json({
          success: true,
          message: 'Statistics endpoint - implementation needed',
          data: {
            employee_id: employeeId,
            date_range: { start_date, end_date },
            stats: 'To be implemented'
          }
        });

      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  /**
   * 🔍 GET /api/v1/availability/search
   * Search availabilities with filters
   */
  router.get(
    '/search/filter',
    requireAuth,
    [
      query('employee_id').optional().isInt({ min: 1 }),
      query('availability_type').optional().isIn(['working', 'vacation', 'sick', 'break', 'meeting', 'unavailable']),
      query('is_available').optional().isBoolean(),
      query('start_date').optional().isISO8601(),
      query('end_date').optional().isISO8601(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 })
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        // This would need to be implemented in the controller
        res.json({
          success: true,
          message: 'Search endpoint - implementation needed',
          filters: req.query
        });

      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  );

  return router;
}

/**
 * 📚 API Documentation Helper
 */
const generateApiDocs = () => {
  return {
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/availability/:employeeId',
        description: 'Get availability for specific employee',
        parameters: {
          path: ['employeeId (integer)'],
          query: ['start_date (YYYY-MM-DD)', 'end_date (YYYY-MM-DD)']
        }
      },
      {
        method: 'POST',
        path: '/api/v1/availability',
        description: 'Create new availability entry',
        body: {
          employee_id: 'integer (required)',
          date: 'string YYYY-MM-DD (required)',
          start_time: 'string HH:MM:SS (optional)',
          end_time: 'string HH:MM:SS (optional)',
          is_available: 'boolean (optional)',
          availability_type: 'string (optional)',
          notes: 'string (optional)'
        }
      },
      {
        method: 'PUT',
        path: '/api/v1/availability/:id',
        description: 'Update existing availability',
        parameters: {
          path: ['id (integer)']
        }
      },
      {
        method: 'DELETE',
        path: '/api/v1/availability/:id',
        description: 'Delete availability entry',
        parameters: {
          path: ['id (integer)']
        }
      },
      {
        method: 'GET',
        path: '/api/v1/availability/overview/all',
        description: 'Get availability overview for all employees',
        parameters: {
          query: ['start_date (YYYY-MM-DD)', 'end_date (YYYY-MM-DD)']
        }
      },
      {
        method: 'GET',
        path: '/api/v1/availability/conflicts/list',
        description: 'Get scheduling conflicts',
        parameters: {
          query: ['start_date (YYYY-MM-DD)', 'end_date (YYYY-MM-DD)']
        }
      },
      {
        method: 'POST',
        path: '/api/v1/availability/bulk/create',
        description: 'Create multiple availability entries',
        body: {
          employee_id: 'integer (required)',
          availability_entries: 'array of availability objects (required)'
        }
      }
    ],
    authentication: 'Bearer token required in Authorization header',
    rate_limit: '100 requests per 15 minutes',
    response_format: {
      success: 'boolean',
      message: 'string',
      data: 'object/array',
      error: 'string (development only)'
    }
  };
};

module.exports = {
  createAvailabilityRoutes,
  generateApiDocs
};