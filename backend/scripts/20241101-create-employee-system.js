// backend/src/migrations/20241101-create-employee-system.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Creating Employee Management System Tables...');
    
    // 👥 EMPLOYEES TABLE
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      
      // 🏢 MULTI-TENANT: Restaurant Reference (exactly like Product.js)
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // 👤 Personal Information
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      
      // 💼 Employment Details
      employee_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      position: {
        type: Sequelize.ENUM('manager', 'chef', 'cook', 'waiter', 'bartender', 'cleaner', 'cashier', 'host'),
        allowNull: false
      },
      department: {
        type: Sequelize.ENUM('kitchen', 'service', 'bar', 'management', 'cleaning'),
        allowNull: false
      },
      employment_type: {
        type: Sequelize.ENUM('fulltime', 'parttime', 'temporary', 'intern', 'freelance'),
        defaultValue: 'fulltime'
      },
      
      // 💰 Compensation
      hourly_wage: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false
      },
      max_hours_per_week: {
        type: Sequelize.INTEGER,
        defaultValue: 40
      },
      min_hours_per_week: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // 📅 Availability & Preferences (JSON for flexibility)
      weekly_availability: {
        type: Sequelize.JSON,
        defaultValue: {
          monday: { available: true, start: '09:00', end: '18:00', preference: 3 },
          tuesday: { available: true, start: '09:00', end: '18:00', preference: 3 },
          wednesday: { available: true, start: '09:00', end: '18:00', preference: 3 },
          thursday: { available: true, start: '09:00', end: '18:00', preference: 3 },
          friday: { available: true, start: '09:00', end: '18:00', preference: 3 },
          saturday: { available: true, start: '10:00', end: '22:00', preference: 2 },
          sunday: { available: false, start: null, end: null, preference: 1 }
        }
      },
      shift_preferences: {
        type: Sequelize.JSON,
        defaultValue: {
          preferredShifts: ['morning', 'afternoon'],
          avoidNightShifts: false,
          maxConsecutiveDays: 5,
          minTimeBetweenShifts: 11,
          weekendWork: 'limited'
        }
      },
      
      // 🎯 Skills & Performance (für KI-Algorithmus)
      skill_level: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        validate: { min: 1, max: 10 }
      },
      certifications: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      languages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: ['german']
      },
      
      // 📊 AI Performance Metrics
      performance_score: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      reliability_score: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      customer_rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      
      // ✅ Status & Dates
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      hire_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      termination_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 📝 Notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 📋 SHIFTS TABLE
    await queryInterface.createTable('shifts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      
      // 🏢 Multi-Tenant
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      // 📅 Schicht-Details
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      break_duration: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      
      // 🎯 Schicht-Typ & Position
      shift_type: {
        type: Sequelize.ENUM('morning', 'afternoon', 'evening', 'night'),
        allowNull: false
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false
      },
      
      // 📊 KI-Daten & Vorhersagen
      predicted_demand: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      actual_demand: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      efficiency_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      labor_cost: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true
      },
      
      // ✅ Status & AI
      status: {
        type: Sequelize.ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'scheduled'
      },
      is_ai_generated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ai_confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      
      // 📝 Notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 📊 SHIFT PERFORMANCE TABLE (für KI-Learning)
    await queryInterface.createTable('shift_performances', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      
      shift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shifts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      // 📊 Performance Metrics
      actual_start_time: Sequelize.TIME,
      actual_end_time: Sequelize.TIME,
      punctuality_score: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      productivity_score: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      customer_interactions: Sequelize.INTEGER,
      sales_generated: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      
      // 🎯 KI-Learning Daten
      weather_condition: Sequelize.STRING,
      customer_count: Sequelize.INTEGER,
      peak_hours_worked: Sequelize.BOOLEAN,
      team_size: Sequelize.INTEGER,
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 🔍 INDEXES für Performance
    await queryInterface.addIndex('employees', ['restaurant_id'], {
      name: 'idx_employees_restaurant_id'
    });
    
    await queryInterface.addIndex('employees', ['restaurant_id', 'is_active'], {
      name: 'idx_employees_restaurant_active'
    });
    
    await queryInterface.addIndex('employees', ['position', 'department'], {
      name: 'idx_employees_position_department'
    });

    await queryInterface.addIndex('shifts', ['restaurant_id', 'date'], {
      name: 'idx_shifts_restaurant_date'
    });
    
    await queryInterface.addIndex('shifts', ['employee_id', 'date'], {
      name: 'idx_shifts_employee_date'
    });
    
    await queryInterface.addIndex('shifts', ['date', 'shift_type'], {
      name: 'idx_shifts_date_type'
    });

    console.log('✅ Employee Management System created successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️ Dropping Employee Management System...');
    
    await queryInterface.dropTable('shift_performances');
    await queryInterface.dropTable('shifts');
    await queryInterface.dropTable('employees');
    
    console.log('✅ Employee Management System dropped!');
  }
};