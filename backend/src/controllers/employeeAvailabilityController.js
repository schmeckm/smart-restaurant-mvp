/**
 * @file EmployeeAvailabilityController.js
 * @description Controller für Mitarbeiterverfügbarkeiten – beinhaltet CRUD-Operationen,
 * Musterverwaltung und Übersicht. Unterstützt Bulk-Insert, Datumsnormalisierung (ISO-8601),
 * Swagger-Dokumentation und Express-Validator-Checks.
 */

const { validationResult } = require('express-validator');

/**
 * 🧭 Helper: Datum in ISO-8601 Format (YYYY-MM-DD) konvertieren
 */
function normalizeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d)) return input; // falls bereits ISO
  return d.toISOString().split('T')[0];
}

/**
 * @swagger
 * tags:
 *   name: Employee Availability
 *   description: Verwaltung der Mitarbeiterverfügbarkeiten
 */
class EmployeeAvailabilityController {
  constructor(pool) {
    this.pool = pool;
  }

  // ===========================================================
  // 📅 GET /api/v1/employees/:employeeId/availability
  // ===========================================================
  /**
   * @swagger
   * /api/v1/employees/{employeeId}/availability:
   *   get:
   *     summary: "📅 Verfügbarkeit eines Mitarbeiters abrufen"
   *     tags: [Employee Availability]
   *     parameters:
   *       - in: path
   *         name: employeeId
   *         required: true
   *         schema:
   *           type: string
   *         description: UUID des Mitarbeiters
   *       - in: query
   *         name: start_date
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Startdatum (YYYY-MM-DD)
   *       - in: query
   *         name: end_date
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Enddatum (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Erfolgreich geladen
   *       404:
   *         description: Mitarbeiter nicht gefunden
   *       500:
   *         description: Interner Serverfehler
   */
  async getEmployeeAvailability(req, res) {
    try {
      const { employeeId } = req.params;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'start_date und end_date sind erforderlich' });
      }

      const client = await this.pool.connect();
      try {
        const employeeResult = await client.query(
          `SELECT id, first_name, last_name, email, position 
           FROM employees 
           WHERE id = $1`,
          [employeeId]
        );
        if (employeeResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Employee nicht gefunden' });
        }

        const availabilityResult = await client.query(
          `
          SELECT 
            id,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            TO_CHAR(start_time, 'HH24:MI:SS') AS start_time,
            TO_CHAR(end_time, 'HH24:MI:SS') AS end_time,
            is_available,
            availability_type,
            notes,
            created_at,
            updated_at
          FROM employee_availability
          WHERE employee_id = $1::uuid
            AND date >= $2 
            AND date <= $3
          ORDER BY date ASC
          `,
          [employeeId, start_date, end_date]
        );

        const patternsResult = await client.query(
          `
          SELECT id, day_of_week, start_time, end_time, is_active
          FROM employee_availability_patterns
          WHERE employee_id = $1::uuid AND is_active = true
          ORDER BY day_of_week ASC
          `,
          [employeeId]
        );

        res.json({
          success: true,
          data: {
            employee: employeeResult.rows[0],
            availability: availabilityResult.rows,
            patterns: patternsResult.rows,
            date_range: { start: start_date, end: end_date }
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

  // ===========================================================
  // 📝 POST /api/v1/employees/:employeeId/availability
  // ===========================================================
  /**
   * @swagger
   * /api/v1/employees/{employeeId}/availability:
   *   post:
   *     summary: "📝 Neue Verfügbarkeit hinzufügen oder aktualisieren"
   *     tags: [Employee Availability]
   *     parameters:
   *       - in: path
   *         name: employeeId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date: { type: string, example: "2025-11-14" }
   *               start_time: { type: string, example: "08:00:00" }
   *               end_time: { type: string, example: "17:00:00" }
   *               is_available: { type: boolean, example: true }
   *               availability_type: { type: string, example: "working" }
   *               notes: { type: string, example: "Frühschicht" }
   *     responses:
   *       200:
   *         description: Erfolgreich gespeichert
   */
  async createAvailability(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validierungsfehler', errors: errors.array() });
      }

      const { employeeId } = req.params;
      const { date, start_time, end_time, is_available, availability_type, notes } = req.body;
      const normalizedDate = normalizeDate(date);

      const client = await this.pool.connect();
      try {
        const employeeCheck = await client.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
        if (employeeCheck.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Employee nicht gefunden' });
        }

        const upsertQuery = `
          INSERT INTO employee_availability 
            (employee_id, date, start_time, end_time, is_available, availability_type, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        const result = await client.query(upsertQuery, [
          employeeId,
          normalizedDate,
          start_time,
          end_time,
          is_available,
          availability_type,
          notes
        ]);

        res.json({ success: true, message: 'Verfügbarkeit erfolgreich gespeichert', data: result.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error creating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Fehler beim Speichern der Verfügbarkeit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===========================================================
  // 🔄 POST /api/v1/employees/:employeeId/availability/bulk
  // ===========================================================
  /**
   * @swagger
   * /api/v1/employees/{employeeId}/availability/bulk:
   *   post:
   *     summary: "🔄 Mehrere Verfügbarkeiten auf einmal speichern (Bulk)"
   *     tags: [Employee Availability]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               availabilities:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     date: { type: string }
   *                     start_time: { type: string }
   *                     end_time: { type: string }
   *                     is_available: { type: boolean }
   *                     availability_type: { type: string }
   *                     notes: { type: string }
   */
  async bulkCreateAvailability(req, res) {
    try {
      const { employeeId } = req.params;
      const { availabilities } = req.body;
      if (!Array.isArray(availabilities) || availabilities.length === 0) {
        return res.status(400).json({ success: false, message: 'availabilities muss ein nicht-leeres Array sein' });
      }

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        for (const a of availabilities) {
          const normalizedDate = normalizeDate(a.date);
          const upsert = `
            INSERT INTO employee_availability 
              (employee_id, date, start_time, end_time, is_available, availability_type, notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (employee_id, date)
            DO UPDATE SET
              start_time=EXCLUDED.start_time,
              end_time=EXCLUDED.end_time,
              is_available=EXCLUDED.is_available,
              availability_type=EXCLUDED.availability_type,
              notes=EXCLUDED.notes,
              updated_at=CURRENT_TIMESTAMP
            RETURNING *
          `;
          const r = await client.query(upsert, [
            employeeId,
            normalizedDate,
            a.start_time,
            a.end_time,
            a.is_available,
            a.availability_type,
            a.notes
          ]);
          results.push(r.rows[0]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: `${results.length} Verfügbarkeiten gespeichert`, data: results });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error bulk creating availability:', error);
      res.status(500).json({ success: false, message: 'Fehler beim Bulk-Speichern', error: error.message });
    }
  }

async createBulkAvailability(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { employee_id, availability_entries } = req.body;
    
    console.log('🔄 Processing bulk availability:', {
      employee_id,
      entries: availability_entries.length
    });

    // ✅ ERLAUBEN: Leere Arrays (Mitarbeiter komplett nicht verfügbar)
    if (!Array.isArray(availability_entries)) {
      return res.status(400).json({ 
        success: false, 
        message: 'availability_entries muss ein Array sein' 
      });
    }

    const client = await this.pool.connect();
    try {
      // ✅ SPEZIALBEHANDLUNG: Leere Arrays
      if (availability_entries.length === 0) {
        console.log('🗑️ Empty array - clearing all availability for employee');
        
        // Lösche alle bestehenden Verfügbarkeiten für diese Woche
        // (Optional - Sie können das auch weglassen)
        const deleteQuery = `
          DELETE FROM employee_availability 
          WHERE employee_id = $1::uuid 
          AND date >= CURRENT_DATE - INTERVAL '7 days'
          AND date <= CURRENT_DATE + INTERVAL '7 days'
        `;
        
        await client.query(deleteQuery, [employee_id]);
        
        return res.json({
          success: true,
          message: 'Alle Verfügbarkeiten für diese Woche gelöscht',
          data: { deleted: true, employee_id }
        });
      }

      // ✅ NORMAL: Bulk insert/update mit Einträgen
      await client.query('BEGIN');
      
      const results = [];
      for (const entry of availability_entries) {
        const normalizedDate = normalizeDate(entry.date);
        
        const upsertQuery = `
          INSERT INTO employee_availability 
            (employee_id, date, start_time, end_time, is_available, availability_type, notes)
          VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (employee_id, date, start_time)
          DO UPDATE SET
            end_time = EXCLUDED.end_time,
            is_available = EXCLUDED.is_available,
            availability_type = EXCLUDED.availability_type,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const result = await client.query(upsertQuery, [
          employee_id,
          normalizedDate,
          entry.start_time,
          entry.end_time,
          entry.is_available !== undefined ? entry.is_available : true,
          entry.availability_type || 'working',
          entry.notes || ''
        ]);
        
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Bulk created ${results.length} availability entries`);
      
      res.json({
        success: true,
        message: `${results.length} Verfügbarkeiten erfolgreich gespeichert`,
        data: results
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error in createBulkAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Bulk-Erstellen der Verfügbarkeiten',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

  // ===========================================================
  // ❌ DELETE /api/v1/employees/:employeeId/availability/:date
  // ===========================================================
  /**
   * @swagger
   * /api/v1/employees/{employeeId}/availability/{date}:
   *   delete:
   *     summary: "❌ Verfügbarkeit löschen"
   *     tags: [Employee Availability]
   */
  async deleteAvailability(req, res) {
    try {
      const { employeeId, date } = req.params;
      const normalizedDate = normalizeDate(date);

      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `DELETE FROM employee_availability 
           WHERE employee_id = $1::uuid AND date = $2
           RETURNING *`,
          [employeeId, normalizedDate]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Verfügbarkeit nicht gefunden' });
        }
        res.json({ success: true, message: 'Verfügbarkeit gelöscht', data: result.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error deleting availability:', error);
      res.status(500).json({ success: false, message: 'Fehler beim Löschen', error: error.message });
    }
  }

  // ===========================================================
  // 🔄 GET /api/v1/employees/:employeeId/availability/patterns
  // ===========================================================
  async getAvailabilityPatterns(req, res) {
    try {
      const { employeeId } = req.params;
      const client = await this.pool.connect();
      try {
        const r = await client.query(
          `SELECT * FROM employee_availability_patterns WHERE employee_id=$1::uuid ORDER BY day_of_week ASC`,
          [employeeId]
        );
        res.json({ success: true, data: r.rows });
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('❌ Error fetching patterns:', e);
      res.status(500).json({ success: false, message: 'Fehler beim Laden der Muster', error: e.message });
    }
  }

  // ===========================================================
  // 📊 GET /api/v1/availability/overview
  // ===========================================================
  /**
   * @swagger
   * /api/v1/availability/overview:
   *   get:
   *     summary: "📊 Übersicht über alle Mitarbeiterverfügbarkeiten"
   *     tags: [Employee Availability]
   */
  async getAvailabilityOverview(req, res) {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'start_date und end_date sind erforderlich' });
      }

      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `
          SELECT 
            e.id as employee_id,
            e.first_name,
            e.last_name,
            e.position,
            TO_CHAR(ea.date,'YYYY-MM-DD') AS date,
            TO_CHAR(ea.start_time,'HH24:MI:SS') AS start_time,
            TO_CHAR(ea.end_time,'HH24:MI:SS') AS end_time,
            ea.is_available,
            ea.availability_type
          FROM employees e
          LEFT JOIN employee_availability ea ON e.id = ea.employee_id 
            AND ea.date >= $1 AND ea.date <= $2
          ORDER BY e.first_name,e.last_name,ea.date
          `,
          [start_date, end_date]
        );

        const grouped = {};
        for (const row of result.rows) {
          const id = row.employee_id;
          if (!grouped[id]) {
            grouped[id] = {
              employee: {
                id,
                firstName: row.first_name,
                lastName: row.last_name,
                position: row.position
              },
              availability: []
            };
          }
          if (row.date) {
            grouped[id].availability.push({
              date: row.date,
              startTime: row.start_time,
              endTime: row.end_time,
              isAvailable: row.is_available,
              availabilityType: row.availability_type
            });
          }
        }

        res.json({ success: true, data: Object.values(grouped), date_range: { start: start_date, end: end_date } });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error fetching overview:', error);
      res.status(500).json({ success: false, message: 'Fehler beim Laden der Übersicht', error: error.message });
    }
  }
}

module.exports = EmployeeAvailabilityController;
