// backend/src/models/Ingredient.js - SIMPLE WORKING VERSION
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'g'
  },
  cost_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  stock_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  min_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'other'
  },
  
  // Basic nutrition (existing columns)
  calories: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  protein: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  carbs: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  fat: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  fiber: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  sugar: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  sodium: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ingredients',
  timestamps: true
});

module.exports = Ingredient;