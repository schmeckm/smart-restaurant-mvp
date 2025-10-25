const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'RecipeIngredient',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'recipes', key: 'id' }, // ✅ lowercase
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'ingredients', key: 'id' }, // ✅ lowercase
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: 'recipe_ingredients',
    timestamps: true,
    underscored: true
  }
);
