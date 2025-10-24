// backend/src/models/RecipeIngredient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeIngredient = sequelize.define('RecipeIngredient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipe_id', // Map to snake_case column
    references: {
      model: 'recipes',
      key: 'id'
    }
  },
  ingredientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ingredient_id', // Map to snake_case column
    references: {
      model: 'ingredients',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'g'
  }
}, {
  tableName: 'recipe_ingredients',
  timestamps: true,
  underscored: true, // Uses snake_case for all columns
  indexes: [
    {
      unique: true,
      fields: ['recipe_id', 'ingredient_id'] // Use actual column names
    }
  ]
});

module.exports = RecipeIngredient;