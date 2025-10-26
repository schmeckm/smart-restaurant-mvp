// backend/src/models/Nutrition.js
// Fixed Nutrition Model WITHOUT comments to avoid SQL syntax errors

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Nutrition = sequelize.define('Nutrition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Polymorphic Relationship
    entityType: {
      type: DataTypes.ENUM('ingredient', 'product'),
      allowNull: false,
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entity_id'
    },
    
    // Basic Nutrients (per 100g/100ml)
    calories: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    protein: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    fat: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    carbs: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    
    // Extended Nutrients
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
    
    // Vitamins (µg per 100g)
    vitaminA: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_a' },
    vitaminC: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_c' },
    vitaminD: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_d' },
    vitaminE: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_e' },
    vitaminK: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_k' },
    vitaminB1: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_b1' },
    vitaminB2: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_b2' },
    vitaminB3: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_b3' },
    vitaminB6: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_b6' },
    vitaminB12: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0, field: 'vitamin_b12' },
    folate: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    
    // Minerals (mg per 100g)
    calcium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    iron: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    magnesium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    phosphorus: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    potassium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    zinc: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    
    // Dietary Flags
    isVegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_vegan'
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_vegetarian'
    },
    isGlutenFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_gluten_free'
    },
    isLactoseFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_lactose_free'
    },
    isOrganic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_organic'
    },
    
    // AI/Verification
    nutritionSource: {
      type: DataTypes.ENUM('manual', 'ai', 'usda', 'api', 'verified'),
      defaultValue: 'manual',
      field: 'nutrition_source'
    },
    aiAnalyzedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ai_analyzed_at'
    },
    aiConfidenceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'ai_confidence_score'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'verified_by'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    }
  }, {
    tableName: 'nutrition',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['verified']
      },
      {
        fields: ['nutrition_source']
      }
    ]
  });

  // Helper Methods
  Nutrition.prototype.getEntity = async function() {
    const models = require('./index');
    if (this.entityType === 'ingredient') {
      return await models.Ingredient.findByPk(this.entityId);
    } else if (this.entityType === 'product') {
      return await models.Product.findByPk(this.entityId);
    }
    return null;
  };

  return Nutrition;
};