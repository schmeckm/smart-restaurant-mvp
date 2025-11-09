/**
 * 🧩 routes/employee/patterns.js
 * Nested unter: /api/v1/employees/:employeeId/pattern
 * Perfekt für deine Vue-Komponente!
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // ✅ Für nested routes
const { body, param, validationResult } = require('express-validator');
const { protect, authorize } = require('../../middleware/auth');
const { pool } = require('../../config/pgPool');

/**
 * 🛡️ MIDDLEWARE
 */
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

/**
 * 🧪 VALIDATION RULES
 */
const validateEmployeeId = [
  param('employeeId').isUUID().withMessage('Employee ID muss eine gültige UUID sein')
];

const validatePatternData = [
  body('monday').isBoolean(),
  body('tuesday').isBoolean(),
  body('wednesday').isBoolean(),
  body('thursday').isBoolean(),
  body('friday').isBoolean(),
  body('saturday').isBoolean(),
  body('sunday').isBoolean(),
  body('preferred_start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('preferred_end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 1000 })
];

/**
 * 🛣️ ROUTES
 */

/**
 * 📅 GET /api/v1/employees/:employeeId/pattern
 * Vue Frontend: axios.get(`/employees/${employeeId}/pattern`)
 */
router.get('/pattern',
  protect,
  validateEmployeeId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const restaurantId = req.user.restaurantId;

      const client = await pool.connect();
      
      try {
        // Verify employee belongs to restaurant
        const employeeCheck = await client.query(
          'SELECT id, first_name, last_name FROM employees WHERE id = $1 AND restaurant_id = $2',
          [employeeId, restaurantId]
        );

        if (employeeCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Employee nicht gefunden'
          });
        }

        // Get pattern
        const patternQuery = `
          SELECT * FROM employee_availability_patterns 
          WHERE employee_id = $1 AND restaurant_id = $2
        `;
        
        const result = await client.query(patternQuery, [employeeId, restaurantId]);

        if (result.rows.length === 0) {
          return res.json({
            success: true,
            data: null,
            message: 'Kein Arbeitsmuster vorhanden',
            employee: {
              id: employeeId,
              name: `${employeeCheck.rows[0].first_name} ${employeeCheck.rows[0].last_name}`
            }
          });
        }

        res.json({
          success: true,
          data: result.rows[0],
          message: 'Arbeitsmuster erfolgreich geladen',
          employee: {
            id: employeeId,
            name: `${employeeCheck.rows[0].first_name} ${employeeCheck.rows[0].last_name}`
          }
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error fetching pattern:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Laden des Arbeitsmusters',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * 💾 POST /api/v1/employees/:employeeId/pattern
 * Vue Frontend: axios.post(`/employees/${employeeId}/pattern`, patternData)
 */
router.post('/pattern',
  protect,
  validateEmployeeId,
  validatePatternData,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const {
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        preferred_start, preferred_end, notes
      } = req.body;
      const restaurantId = req.user.restaurantId;

      const client = await pool.connect();
      
      try {
        // Verify employee belongs to restaurant
        const employeeCheck = await client.query(
          'SELECT id, first_name, last_name FROM employees WHERE id = $1 AND restaurant_id = $2',
          [employeeId, restaurantId]
        );

        if (employeeCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Employee nicht gefunden'
          });
        }

        // Check if pattern already exists
        const existsCheck = await client.query(
          'SELECT id FROM employee_availability_patterns WHERE employee_id = $1 AND restaurant_id = $2',
          [employeeId, restaurantId]
        );

        let query;
        let queryParams;

        if (existsCheck.rows.length > 0) {
          // Update existing pattern
          query = `
            UPDATE employee_availability_patterns
            SET monday = $3, tuesday = $4, wednesday = $5, thursday = $6, 
                friday = $7, saturday = $8, sunday = $9,
                preferred_start = $10, preferred_end = $11, notes = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $1 AND restaurant_id = $2
            RETURNING *
          `;
          queryParams = [
            employeeId, restaurantId, monday, tuesday, wednesday, thursday,
            friday, saturday, sunday, preferred_start, preferred_end, notes
          ];
        } else {
          // Insert new pattern
          query = `
            INSERT INTO employee_availability_patterns
            (employee_id, restaurant_id, monday, tuesday, wednesday, thursday, 
             friday, saturday, sunday, preferred_start, preferred_end, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
          `;
          queryParams = [
            employeeId, restaurantId, monday, tuesday, wednesday, thursday,
            friday, saturday, sunday, preferred_start, preferred_end, notes
          ];
        }

        const result = await client.query(query, queryParams);

        res.json({
          success: true,
          message: 'Arbeitsmuster erfolgreich gespeichert',
          data: result.rows[0],
          employee: {
            id: employeeId,
            name: `${employeeCheck.rows[0].first_name} ${employeeCheck.rows[0].last_name}`
          }
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error saving pattern:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Speichern des Arbeitsmusters',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * 🗑️ DELETE /api/v1/employees/:employeeId/pattern
 * Vue Frontend: axios.delete(`/employees/${employeeId}/pattern`)
 */
router.delete('/pattern',
  protect,
  validateEmployeeId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const restaurantId = req.user.restaurantId;

      const client = await pool.connect();
      
      try {
        const deleteQuery = `
          DELETE FROM employee_availability_patterns 
          WHERE employee_id = $1 AND restaurant_id = $2
          RETURNING *
        `;

        const result = await client.query(deleteQuery, [employeeId, restaurantId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Arbeitsmuster nicht gefunden'
          });
        }

        res.json({
          success: true,
          message: 'Arbeitsmuster erfolgreich gelöscht',
          data: result.rows[0]
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error deleting pattern:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen des Arbeitsmusters',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * 📊 GET /api/v1/employees/:employeeId/pattern/preview
 * Generate availability preview based on pattern
 */
router.get('/pattern/preview',
  protect,
  validateEmployeeId,
  [
    param('employeeId').isUUID(),
    query('start_date').isISO8601().withMessage('start_date muss YYYY-MM-DD sein'),
    query('end_date').isISO8601().withMessage('end_date muss YYYY-MM-DD sein')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { start_date, end_date } = req.query;
      const restaurantId = req.user.restaurantId;

      const client = await pool.connect();
      
      try {
        // Get pattern
        const patternQuery = `
          SELECT * FROM employee_availability_patterns 
          WHERE employee_id = $1 AND restaurant_id = $2
        `;
        
        const patternResult = await client.query(patternQuery, [employeeId, restaurantId]);

        if (patternResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Kein Arbeitsmuster vorhanden'
          });
        }

        const pattern = patternResult.rows[0];
        const preview = [];
        const start = new Date(start_date);
        const end = new Date(end_date);

        // Generate preview based on pattern
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[dayOfWeek];

          if (pattern[dayName]) {
            preview.push({
              date: date.toISOString().split('T')[0],
              start_time: pattern.preferred_start,
              end_time: pattern.preferred_end,
              is_available: true,
              availability_type: 'working',
              notes: `Generated from pattern: ${dayName}`
            });
          }
        }

        res.json({
          success: true,
          data: preview,
          pattern: pattern,
          date_range: { start_date, end_date }
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error generating preview:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Generieren der Vorschau',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;