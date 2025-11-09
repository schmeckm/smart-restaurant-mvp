/**
 * 🧩 Employee Availability Pattern Routes
 * Define working days (Mo–So) + preferred start/end times per employee
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const pool = require('../../config/database');

/**
 * 🧰 Validation helper
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Employee Availability Pattern
 *   description: Mitarbeiter-Wochentagsmuster (Mo–So Präferenzen)
 */

/**
 * @swagger
 * /api/v1/employees/{id}/pattern:
 *   get:
 *     summary: Holt das Wochenmuster eines Mitarbeiters
 *     tags: [Employee Availability Pattern]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mitarbeiter-ID
 *     responses:
 *       200:
 *         description: Wochenmuster erfolgreich geladen
 */
router.get('/:id/pattern', protect, async (req, res) => {
  const { id } = req.params

  try {
    const client = await pool.connect()
    const result = await client.query(
      `SELECT * FROM employee_availability_patterns WHERE employee_id = $1`,
      [id]
    )
    client.release()

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Kein Muster vorhanden'
      })
    }

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Muster erfolgreich geladen'
    })
  } catch (err) {
    console.error('❌ Error fetching pattern:', err)
    res.status(500).json({
      success: false,
      message: 'Serverfehler',
      error: err.message
    })
  }
})


/**
 * @swagger
 * /api/v1/employees/{id}/pattern:
 *   post:
 *     summary: Speichert oder aktualisiert das Wochenmuster eines Mitarbeiters
 *     tags: [Employee Availability Pattern]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/pattern',
  protect,
  [
    param('id').notEmpty().withMessage('Employee ID erforderlich'),
    body('monday').isBoolean(),
    body('tuesday').isBoolean(),
    body('wednesday').isBoolean(),
    body('thursday').isBoolean(),
    body('friday').isBoolean(),
    body('saturday').isBoolean(),
    body('sunday').isBoolean(),
    body('preferred_start').optional().isString(),
    body('preferred_end').optional().isString(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      preferred_start,
      preferred_end,
      notes,
    } = req.body;

    try {
      const client = await pool.connect();

      const exists = await client.query(
        `SELECT id FROM employee_availability_patterns WHERE employee_id = $1`,
        [id]
      );

      let query;
      if (exists.rows.length > 0) {
        // 🔁 Update existing pattern
        query = `
          UPDATE employee_availability_patterns
          SET monday=$2, tuesday=$3, wednesday=$4, thursday=$5, friday=$6,
              saturday=$7, sunday=$8, preferred_start=$9, preferred_end=$10,
              notes=$11, updated_at=NOW()
          WHERE employee_id=$1
          RETURNING *;
        `;
      } else {
        // 🆕 Insert new pattern
        query = `
          INSERT INTO employee_availability_patterns
          (employee_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
           preferred_start, preferred_end, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING *;
        `;
      }

      const result = await client.query(query, [
        id,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        preferred_start,
        preferred_end,
        notes || null,
      ]);

      client.release();

      res.json({
        success: true,
        message: 'Muster erfolgreich gespeichert',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('❌ Error saving pattern:', err);
      res.status(500).json({ success: false, message: 'Serverfehler', error: err.message });
    }
  }
);

module.exports = router;
