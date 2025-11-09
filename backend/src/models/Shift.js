// backend/src/models/Shift.js
module.exports = (sequelize) => {
  const Shift = sequelize.define('Shift', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // 📅 Schicht-Details
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    breakDuration: {
      type: DataTypes.INTEGER, // Minuten
      defaultValue: 30,
      field: 'break_duration'
    },
    
    // 🎯 Schicht-Typ & Anforderungen
    shiftType: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
      allowNull: false,
      field: 'shift_type'
    },
    position: {
      type: DataTypes.STRING, // Koch, Kellner, etc.
      allowNull: false
    },
    
    // 📊 KI-Daten
    predictedDemand: {
      type: DataTypes.INTEGER,
      field: 'predicted_demand'
    },
    actualDemand: {
      type: DataTypes.INTEGER,
      field: 'actual_demand'
    },
    efficiencyScore: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'efficiency_score'
    },
    
    // ✅ Status
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    isAiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_ai_generated'
    }
  });

  return Shift;
};

// backend/src/models/EmployeeAvailability.js  
module.exports = (sequelize) => {
  const EmployeeAvailability = sequelize.define('EmployeeAvailability', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    
    // 📅 Verfügbarkeit
    dayOfWeek: {
      type: DataTypes.INTEGER, // 0 = Sonntag, 1 = Montag, etc.
      allowNull: false,
      field: 'day_of_week'
    },
    startTime: {
      type: DataTypes.TIME,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      field: 'end_time'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_available'
    },
    
    // 🎯 Präferenzen
    preferenceLevel: {
      type: DataTypes.INTEGER, // 1 = ungern, 5 = gerne
      defaultValue: 3,
      field: 'preference_level'
    }
  });

  return EmployeeAvailability;
};