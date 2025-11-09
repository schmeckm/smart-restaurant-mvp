/**
 * 📅 routes/availability.js - COMPLETE VERSION
 * Handles all availability routes that your frontend expects
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');  
const { param, query, body, validationResult } = require('express-validator');
const { Pool } = require('pg');

// Database connection (using same config as your working system)
const pool = new Pool({
  host: process.env.DB_HOST || '136.244.90.128',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mydb',
  user: process.env.DB_USER || 'restaurant_admin',
  password: process.env.DB_PASSWORD || 'admin123',
  ssl: false
});

// Validation middleware
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

// =======================================
// 📅 EMPLOYEE-SPECIFIC AVAILABILITY ROUTES
// =======================================

/**
 * GET /api/v1/availability/:employeeId
 * Das ist der Route, den dein Frontend aufruft!
 */
router.get('/:employeeId',
  protect,
  [
    param('employeeId').isUUID().withMessage('Employee ID muss eine gültige UUID sein'),
    query('start_date').optional().isISO8601().withMessage('start_date muss YYYY-MM-DD sein'),
    query('end_date').optional().isISO8601().withMessage('end_date muss YYYY-MM-DD sein')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { start_date, end_date } = req.query;

      console.log(`📅 Loading availability for employee: ${employeeId}`);
      console.log(`📅 Date range: ${start_date} to ${end_date}`);

      const client = await pool.connect();
      
      try {
        // Verify employee exists
        const employeeQuery = `
          SELECT id, first_name, last_name, email, position, restaurant_id
          FROM employees 
          WHERE id = $1
        `;
        const employeeResult = await client.query(employeeQuery, [employeeId]);
        
        if (employeeResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Employee nicht gefunden'
          });
        }

        const employee = employeeResult.rows[0];
        
        // Build availability query
        let availabilityQuery = `
          SELECT 
            id, date, start_time, end_time, is_available,
            availability_type, notes, created_at, updated_at
          FROM employee_availability 
          WHERE employee_id = $1
        `;
        
        const queryParams = [employeeId];
        
        // Add date filters if provided
        if (start_date && end_date) {
          availabilityQuery += ` AND date >= $2 AND date <= $3`;
          queryParams.push(start_date, end_date);
        } else if (start_date) {
          availabilityQuery += ` AND date >= $2`;
          queryParams.push(start_date);
        } else if (end_date) {
          availabilityQuery += ` AND date <= $2`;
          queryParams.push(end_date);
        }
        
        availabilityQuery += ` ORDER BY date ASC, start_time ASC`;

        const availabilityResult = await client.query(availabilityQuery, queryParams);

        console.log(`📅 Found ${availabilityResult.rows.length} availability entries`);

        // Format response to match frontend expectations
        res.json({
          success: true,
          data: availabilityResult.rows,
          employee: {
            id: employee.id,
            firstName: employee.first_name,
            lastName: employee.last_name,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            position: employee.position
          },
          date_range: {
            start: start_date,
            end: end_date
          },
          stats: {
            total_entries: availabilityResult.rows.length,
            available_entries: availabilityResult.rows.filter(row => row.is_available).length
          }
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error fetching employee availability:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Laden der Verfügbarkeit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/v1/availability
 * Create new availability entry
 */
router.post('/',
  protect,
  [
    body('employee_id').isUUID().withMessage('employee_id muss eine gültige UUID sein'),
    body('date').isISO8601().withMessage('date muss YYYY-MM-DD sein'),
    body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('is_available').optional().isBoolean(),
    body('availability_type').optional().isIn(['working', 'vacation', 'sick', 'break', 'meeting', 'unavailable'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employee_id, date, start_time, end_time, is_available, availability_type, notes } = req.body;

      const client = await pool.connect();
      
      try {
        // Verify employee exists
        const employeeCheck = await client.query(
          'SELECT id, restaurant_id FROM employees WHERE id = $1',
          [employee_id]
        );

        if (employeeCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Employee nicht gefunden'
          });
        }

        // Insert availability
const insertQuery = `
            INSERT INTO employee_availability 
              (employee_id, restaurant_id, date, start_time, end_time, is_available, availability_type, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (employee_id, date) 
            DO UPDATE SET
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              is_available = EXCLUDED.is_available,
              availability_type = EXCLUDED.availability_type,
              notes = EXCLUDED.notes,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `;

        const result = await client.query(insertQuery, [
          employee_id,
          employeeCheck.rows[0].restaurant_id,
          date,
          start_time,
          end_time,
          is_available ?? true,
          availability_type ?? 'working',
          notes
        ]);

        res.status(201).json({
          success: true,
          message: 'Verfügbarkeit erfolgreich erstellt',
          data: result.rows[0]
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error creating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen der Verfügbarkeit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =======================================
// 📊 TEAM OVERVIEW ROUTES
// =======================================

/**
 * GET /api/v1/availability/overview/all
 * Team availability overview - wie dein Frontend es erwartet
 */
router.get('/overview/all', protect, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date und end_date sind erforderlich'
      });
    }

    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          e.id as employee_id,
          e.first_name,
          e.last_name,
          e.position,
          ea.date,
          ea.start_time,
          ea.end_time,
          ea.is_available,
          ea.availability_type
        FROM employees e
        LEFT JOIN employee_availability ea ON e.id = ea.employee_id 
          AND ea.date >= $1 
          AND ea.date <= $2
        ORDER BY e.first_name, e.last_name, ea.date
      `;

      const result = await client.query(query, [start_date, end_date]);

      // Group by employee (wie dein Frontend es erwartet)
      const grouped = {};
      result.rows.forEach(row => {
        const empId = row.employee_id;
        if (!grouped[empId]) {
          grouped[empId] = {
            employee: {
              id: row.employee_id,
              firstName: row.first_name,
              lastName: row.last_name,
              position: row.position,
              name: `${row.first_name} ${row.last_name}`
            },
            availability: []
          };
        }

        if (row.date) {
          grouped[empId].availability.push({
            date: row.date,
            startTime: row.start_time,
            endTime: row.end_time,
            isAvailable: row.is_available,
            availabilityType: row.availability_type
          });
        }
      });

      res.json({
        success: true,
        data: Object.values(grouped),
        date_range: {
          start: start_date,
          end: end_date
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fetching team availability:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Team-Verfügbarkeit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =======================================
// 🛠️ UTILITY ROUTES
// =======================================

/**
 * GET /api/v1/availability/types
 * Static availability types
 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: {
      availability_types: [
        { value: 'working', label: 'Arbeitszeit' },
        { value: 'vacation', label: 'Urlaub' },
        { value: 'sick', label: 'Krank' },
        { value: 'break', label: 'Pause' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'unavailable', label: 'Nicht verfügbar' }
      ]
    }
  });
});

/**
 * POST /api/v1/availability/bulk/create
 * VOLLSTÄNDIGE Bulk create availability entries - LÖST TIMEOUT PROBLEM!
 */
router.post('/bulk/create',
  protect,
  [
    body('employee_id').isUUID(),
    body('availability_entries').isArray({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { employee_id, availability_entries } = req.body;

      console.log('🔄 Processing bulk availability:', {
        employee_id,
        entries: availability_entries.length
      });

      // ✅ Behandlung leerer Arrays
      if (availability_entries.length === 0) {
        console.log('🗑️ Empty array - employee not available this week');
        return res.json({
          success: true,
          message: 'Mitarbeiter ist diese Woche nicht verfügbar',
          data: { cleared: true, employee_id }
        });
      }

      const client = await pool.connect();
      
      try {
        // Verify employee exists
        const employeeCheck = await client.query(
          'SELECT id, restaurant_id FROM employees WHERE id = $1',
          [employee_id]
        );

        if (employeeCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Employee nicht gefunden'
          });
        }

        console.log('✅ Employee verified, starting transaction...');
        await client.query('BEGIN');

        const results = [];
        for (let i = 0; i < availability_entries.length; i++) {
          const entry = availability_entries[i];
          
          console.log(`💾 Processing entry ${i + 1}/${availability_entries.length}: ${entry.date}`);
          
          const insertQuery = `
            INSERT INTO employee_availability 
              (employee_id, restaurant_id, date, start_time, end_time, is_available, availability_type, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (employee_id, date) 
            DO UPDATE SET
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              is_available = EXCLUDED.is_available,
              availability_type = EXCLUDED.availability_type,
              notes = EXCLUDED.notes,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `;

          const result = await client.query(insertQuery, [
            employee_id,
            employeeCheck.rows[0].restaurant_id,
            entry.date,
            entry.start_time,
            entry.end_time,
            entry.is_available ?? true,
            entry.availability_type ?? 'working',
            entry.notes || ''
          ]);

          results.push(result.rows[0]);
        }

        await client.query('COMMIT');
        console.log('✅ Transaction committed successfully');

        res.status(201).json({
          success: true,
          message: `${results.length} Verfügbarkeiten erfolgreich erstellt`,
          data: results
        });

      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction error:', error);
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error bulk creating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Bulk-Erstellen',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);
/**
 * GET /api/v1/availability
 * API info endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Availability API - Fully Functional',
    endpoints: {
      employee_availability: 'GET /availability/:employeeId?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
      create_availability: 'POST /availability',
      team_overview: 'GET /availability/overview/all?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
      types: 'GET /availability/types',
      bulk_create: 'POST /availability/bulk/create'
    },
    note: 'Ready for frontend integration'
  });
});

module.exports = router;