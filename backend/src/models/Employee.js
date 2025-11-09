// backend/src/models/Employee.js
// COMPLETE Employee Model with all AI Scheduling Features

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // 🏢 MULTI-TENANT: Restaurant Reference
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    // 👤 Personal Information
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
      validate: { notEmpty: true }
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
      validate: { notEmpty: true }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // 💼 Employment Details
    employeeNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'employee_number'
    },
    position: {
      type: DataTypes.ENUM('manager', 'chef', 'cook', 'waiter', 'bartender', 'cleaner', 'cashier', 'host'),
      allowNull: false
    },
    department: {
      type: DataTypes.ENUM('kitchen', 'service', 'bar', 'management', 'cleaning'),
      allowNull: false
    },
    employmentType: {
      type: DataTypes.ENUM('fulltime', 'parttime', 'temporary', 'intern', 'freelance'),
      defaultValue: 'fulltime',
      field: 'employment_type'
    },
    
    // 💰 Compensation
    hourlyWage: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: 'hourly_wage',
      validate: { min: 0 }
    },
    maxHoursPerWeek: {
      type: DataTypes.INTEGER,
      defaultValue: 40,
      field: 'max_hours_per_week',
      validate: { min: 1, max: 60 }
    },
    minHoursPerWeek: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'min_hours_per_week'
    },
    
    // 📅 Availability & Preferences
    weeklyAvailability: {
      type: DataTypes.JSON,
      defaultValue: {
        monday: { available: true, start: '09:00', end: '18:00', preference: 3 },
        tuesday: { available: true, start: '09:00', end: '18:00', preference: 3 },
        wednesday: { available: true, start: '09:00', end: '18:00', preference: 3 },
        thursday: { available: true, start: '09:00', end: '18:00', preference: 3 },
        friday: { available: true, start: '09:00', end: '18:00', preference: 3 },
        saturday: { available: true, start: '10:00', end: '22:00', preference: 2 },
        sunday: { available: false, start: null, end: null, preference: 1 }
      },
      field: 'weekly_availability'
    },
    shiftPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        preferredShifts: ['morning', 'afternoon'],
        avoidNightShifts: false,
        maxConsecutiveDays: 5,
        minTimeBetweenShifts: 11,
        weekendWork: 'limited'
      },
      field: 'shift_preferences'
    },
    
    // 🎯 Skills & Performance
    skillLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'skill_level',
      validate: { min: 1, max: 10 }
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['german']
    },
    
    // 📊 AI Performance Metrics
    performanceScore: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      field: 'performance_score',
      validate: { min: 0, max: 10 }
    },
    reliabilityScore: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      field: 'reliability_score',
      validate: { min: 0, max: 10 }
    },
    customerRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      field: 'customer_rating',
      validate: { min: 0, max: 10 }
    },
    
    // ✅ Status & Dates
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'hire_date'
    },
    terminationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'termination_date'
    },
    
    // 📝 Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['restaurant_id'], name: 'idx_employees_restaurant_id' },
      { fields: ['restaurant_id', 'is_active'], name: 'idx_employees_restaurant_active' },
      { fields: ['position', 'department'], name: 'idx_employees_position_department' },
      { fields: ['employee_number', 'restaurant_id'], name: 'idx_employees_number_restaurant', unique: true }
    ]
  });

  // ===============================
  // 🔗 Associations
  // ===============================
  Employee.associate = (models) => {
    if (models.Restaurant) {
      Employee.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }

    if (models.Shift) {
      Employee.hasMany(models.Shift, {
        foreignKey: 'employeeId',
        as: 'shifts'
      });
    }
  };

  // ===============================
  // 🔹 Instance Methods
  // ===============================
  
  // Full name getter
  Employee.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  // Generate employee number
  Employee.prototype.generateEmployeeNumber = async function() {
    try {
      const restaurant = await this.getRestaurant();
      const restaurantCode = restaurant ? restaurant.name.substring(0, 3).toUpperCase() : 'EMP';
      
      const lastEmployee = await Employee.findOne({
        where: { restaurantId: this.restaurantId },
        order: [['employeeNumber', 'DESC']],
        paranoid: false
      });
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeNumber) {
        const match = lastEmployee.employeeNumber.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.employeeNumber = `${restaurantCode}-${nextNumber.toString().padStart(3, '0')}`;
      return this.employeeNumber;
    } catch (error) {
      console.error('Error generating employee number:', error);
      this.employeeNumber = `EMP-${Date.now()}`;
      return this.employeeNumber;
    }
  };

  // Check if employee is available on specific day/time
  Employee.prototype.isAvailableAt = function(dayOfWeek, time) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const availability = this.weeklyAvailability[dayName];
    
    if (!availability || !availability.available) return false;
    
    const timeNum = parseInt(time.replace(':', ''));
    const startNum = parseInt(availability.start.replace(':', ''));
    const endNum = parseInt(availability.end.replace(':', ''));
    
    return timeNum >= startNum && timeNum <= endNum;
  };

  // Calculate compatibility score for a specific shift
  Employee.prototype.calculateShiftCompatibility = function(shiftData) {
    let score = 0;
    const { shiftType, date, startTime, position } = shiftData;
    
    // Base compatibility by position match
    if (this.position === position) score += 40;
    else if (this.department === 'service' && position === 'waiter') score += 30;
    else if (this.department === 'kitchen' && position === 'cook') score += 30;
    else score += 10;
    
    // Skill level bonus
    score += (this.skillLevel * 2);
    
    // Availability preference
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const availability = this.weeklyAvailability[dayName];
    
    if (availability && availability.available) {
      score += (availability.preference * 5);
    } else {
      score -= 50;
    }
    
    // Shift type preference
    const preferences = this.shiftPreferences;
    if (preferences.preferredShifts && preferences.preferredShifts.includes(shiftType)) {
      score += 15;
    }
    if (preferences.avoidNightShifts && shiftType === 'night') {
      score -= 20;
    }
    
    // Performance bonus
    score += (this.performanceScore * 2);
    
    return Math.max(0, Math.min(100, score));
  };

  // Get weekly work hours
  Employee.prototype.getWeeklyHours = async function(weekStart) {
    try {
      const { Shift } = sequelize.models;
      if (!Shift) return 0;
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const shifts = await Shift.findAll({
        where: {
          employeeId: this.id,
          date: {
            [sequelize.Sequelize.Op.between]: [weekStart, weekEnd]
          },
          status: ['scheduled', 'confirmed', 'completed']
        }
      });
      
      return shifts.reduce((total, shift) => {
        const start = new Date(`2000-01-01 ${shift.startTime}`);
        const end = new Date(`2000-01-01 ${shift.endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);
        return total + hours - (shift.breakDuration || 0) / 60;
      }, 0);
    } catch (error) {
      console.error('Error calculating weekly hours:', error);
      return 0;
    }
  };

  // ===============================
  // 🔹 Class Methods
  // ===============================
  
  Employee.getActiveEmployees = async function(restaurantId) {
    return await Employee.findAll({
      where: { isActive: true, restaurantId },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  };

  Employee.getByDepartment = async function(department, restaurantId) {
    return await Employee.findAll({
      where: { department, restaurantId, isActive: true },
      order: [['skillLevel', 'DESC'], ['performanceScore', 'DESC']]
    });
  };

  Employee.getAvailableForShift = async function(restaurantId, shiftData) {
    try {
      const employees = await Employee.getActiveEmployees(restaurantId);
      
      return employees
        .filter(emp => emp.isAvailableAt(new Date(shiftData.date).getDay(), shiftData.startTime))
        .map(emp => ({
          ...emp.toJSON(),
          compatibilityScore: emp.calculateShiftCompatibility(shiftData)
        }))
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    } catch (error) {
      console.error('Error getting available employees:', error);
      return [];
    }
  };

  Employee.getTopPerformers = async function(restaurantId, limit = 5) {
    return await Employee.findAll({
      where: { restaurantId, isActive: true },
      order: [
        ['performanceScore', 'DESC'],
        ['reliabilityScore', 'DESC'],
        ['skillLevel', 'DESC']
      ],
      limit
    });
  };

  return Employee;
};