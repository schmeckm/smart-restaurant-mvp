// backend/src/models/Nutrition.js
const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Nutrition:
 *       type: object
 *       required:
 *         - entityType
 *         - entityId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         entityType:
 *           type: string
 *           example: ingredient
 *           description: Type of entity (ingredient, recipe, or product)
 *         entityId:
 *           type: string
 *           format: uuid
 *           description: UUID of the related entity
 *         calories:
 *           type: number
 *           example: 52
 *           description: Total calories (kcal)
 *         protein:
 *           type: number
 *           example: 0.3
 *           description: Protein in grams
 *         fat:
 *           type: number
 *           example: 0.2
 *           description: Fat in grams
 *         carbohydrates:
 *           type: number
 *           example: 14
 *           description: Carbohydrates in grams
 *         fiber:
 *           type: number
 *           example: 2.4
 *           description: Dietary fiber in grams
 *         sugar:
 *           type: number
 *           example: 10
 *           description: Sugar in grams
 *         nutritionSource:
 *           type: string
 *           example: ai-claude
 *           description: Source of nutrition data (manual, USDA, AI, fallback)
 */

module.exports = (sequelize) => {
  const Nutrition = sequelize.define(
    'Nutrition',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'entity_type',
        validate: {
          isIn: [['recipe', 'product', 'ingredient']],
        },
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entity_id',
      },
      calories: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      protein: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      fat: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      carbohydrates: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      fiber: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      sugar: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: { min: 0 },
      },
      nutritionSource: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'manual',
        field: 'nutrition_source',
      },
    },
    {
      tableName: 'nutrition',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['entity_type', 'entity_id'],
          name: 'idx_nutrition_entity',
        },
      ],
    }
  );

  return Nutrition;
};
