/**
 * 📋 Employee Availability Model
 * Database model and business logic for employee availability
 */

class EmployeeAvailabilityModel {
  constructor(pool) {
    this.pool = pool;
    this.tableName = 'employee_availability';
  }

  /**
   * 🏗️ Create table schema
   */
  static getCreateTableSQL() {
    return `
      CREATE TABLE IF NOT EXISTS employee_availability (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        is_available BOOLEAN DEFAULT true,
        availability_type VARCHAR(50) DEFAULT 'working',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        CONSTRAINT valid_time_range CHECK (
          (start_time IS NULL AND end_time IS NULL) OR 
          (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        ),
        CONSTRAINT valid_availability_type CHECK (
          availability_type IN ('working', 'vacation', 'sick', 'break', 'meeting', 'unavailable')
        ),
        
        -- Unique constraint to prevent exact duplicates
        UNIQUE(employee_id, date, start_time, end_time)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_employee_availability_employee_date 
        ON employee_availability(employee_id, date);
      CREATE INDEX IF NOT EXISTS idx_employee_availability_date_range 
        ON employee_availability(date, start_time, end_time);
      CREATE INDEX IF NOT EXISTS idx_employee_availability_type 
        ON employee_availability(availability_type);

      -- Trigger for updated_at
      CREATE OR REPLACE FUNCTION update_employee_availability_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_employee_availability_updated_at 
        ON employee_availability;
      CREATE TRIGGER trigger_update_employee_availability_updated_at
        BEFORE UPDATE ON employee_availability
        FOR EACH ROW EXECUTE FUNCTION update_employee_availability_updated_at();
    `;
  }

  /**
   * 🏗️ Setup database schema
   */
  async initializeSchema() {
    const client = await this.pool.connect();
    try {
      await client.query(EmployeeAvailabilityModel.getCreateTableSQL());
      console.log('✅ Employee Availability table schema initialized');
    } catch (error) {
      console.error('❌ Error initializing schema:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * ✅ Validate availability data
   */
  validateAvailabilityData(data) {
    const errors = [];
    
    // Required fields
    if (!data.employee_id) {
      errors.push('employee_id ist erforderlich');
    }
    
    if (!data.date) {
      errors.push('date ist erforderlich');
    }

    // Date validation
    if (data.date && !this.isValidDate(data.date)) {
      errors.push('Ungültiges Datumsformat (YYYY-MM-DD)');
    }

    // Time validation
    if (data.start_time && !this.isValidTime(data.start_time)) {
      errors.push('Ungültiges start_time Format (HH:MM:SS)');
    }

    if (data.end_time && !this.isValidTime(data.end_time)) {
      errors.push('Ungültiges end_time Format (HH:MM:SS)');
    }

    // Time range validation
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      errors.push('start_time muss vor end_time liegen');
    }

    // Availability type validation
    const validTypes = ['working', 'vacation', 'sick', 'break', 'meeting', 'unavailable'];
    if (data.availability_type && !validTypes.includes(data.availability_type)) {
      errors.push(`availability_type muss einer der folgenden Werte sein: ${validTypes.join(', ')}`);
    }

    // Boolean validation
    if (data.is_available !== undefined && typeof data.is_available !== 'boolean') {
      errors.push('is_available muss ein Boolean-Wert sein');
    }

    return errors;
  }

  /**
   * 📅 Date validation helper
   */
  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * ⏰ Time validation helper  
   */
  isValidTime(timeString) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return regex.test(timeString);
  }

  /**
   * 🔍 Find overlapping availabilities
   */
  async findOverlappingAvailabilities(employeeId, date, startTime, endTime, excludeId = null) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE employee_id = $1 
          AND date = $2 
          AND (
            (start_time <= $3 AND end_time > $3) OR
            (start_time < $4 AND end_time >= $4) OR
            (start_time >= $3 AND end_time <= $4)
          )
      `;
      
      const params = [employeeId, date, startTime, endTime];
      
      if (excludeId) {
        query += ` AND id != $5`;
        params.push(excludeId);
      }

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 📊 Get availability statistics
   */
  async getAvailabilityStats(startDate, endDate) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN is_available = true THEN 1 END) as available_count,
          COUNT(CASE WHEN is_available = false THEN 1 END) as unavailable_count,
          COUNT(DISTINCT employee_id) as employees_with_availability,
          availability_type,
          COUNT(*) as type_count
        FROM ${this.tableName}
        WHERE date >= $1 AND date <= $2
        GROUP BY ROLLUP(availability_type)
        ORDER BY availability_type NULLS LAST
      `;

      const result = await client.query(query, [startDate, endDate]);
      
      const stats = {
        total: 0,
        available: 0,
        unavailable: 0,
        employees: 0,
        by_type: {}
      };

      result.rows.forEach(row => {
        if (row.availability_type === null) {
          // Rollup row with totals
          stats.total = parseInt(row.total_entries);
          stats.available = parseInt(row.available_count);
          stats.unavailable = parseInt(row.unavailable_count);
          stats.employees = parseInt(row.employees_with_availability);
        } else {
          stats.by_type[row.availability_type] = parseInt(row.type_count);
        }
      });

      return stats;
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Bulk operations helper
   */
  async bulkInsert(availabilities) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO ${this.tableName} 
        (employee_id, date, start_time, end_time, is_available, availability_type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const results = [];
      
      for (const availability of availabilities) {
        const result = await client.query(insertQuery, [
          availability.employee_id,
          availability.date,
          availability.start_time,
          availability.end_time,
          availability.is_available,
          availability.availability_type,
          availability.notes
        ]);
        
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🧹 Cleanup old records
   */
  async cleanupOldRecords(daysBefore = 365) {
    const client = await this.pool.connect();
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBefore);
      
      const query = `
        DELETE FROM ${this.tableName}
        WHERE date < $1
        RETURNING count(*)
      `;

      const result = await client.query(query, [cutoffDate.toISOString().split('T')[0]]);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * 📈 Get employee workload
   */
  async getEmployeeWorkload(employeeId, startDate, endDate) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          date,
          COUNT(*) as total_slots,
          COUNT(CASE WHEN is_available = true THEN 1 END) as available_slots,
          SUM(
            CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (end_time - start_time))/3600 
            ELSE 0 END
          ) as total_hours,
          SUM(
            CASE WHEN is_available = true AND start_time IS NOT NULL AND end_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (end_time - start_time))/3600 
            ELSE 0 END
          ) as available_hours
        FROM ${this.tableName}
        WHERE employee_id = $1 
          AND date >= $2 
          AND date <= $3
        GROUP BY date
        ORDER BY date
      `;

      const result = await client.query(query, [employeeId, startDate, endDate]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = EmployeeAvailabilityModel;