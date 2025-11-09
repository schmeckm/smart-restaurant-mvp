// models/EmployeePattern.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmployeePattern = sequelize.define('EmployeePattern', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  monday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tuesday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  wednesday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  thursday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  friday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  saturday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sunday: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferred_start: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferred_end: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'employee_availability_patterns',
  timestamps: true
});

module.exports = EmployeePattern;
