// backend/models/Nutrition.js
// Separate Nutrition Model für Ingredients und Products

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Nutrition = sequelize.define('Nutrition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Polymorphic Relationship
    entity_type: {
      type: DataTypes.ENUM('ingredient', 'product'),
      allowNull: false,
      comment: 'Typ der Entity: ingredient oder product'
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID des Ingredients oder Products'
    },
    
    // Basis-Nährstoffe (pro 100g/100ml)
    calories: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Kalorien (kcal) pro 100g'
    },
    protein: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Protein (g) pro 100g'
    },
    fat: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Fett (g) pro 100g'
    },
    carbs: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Kohlenhydrate (g) pro 100g'
    },
    
    // Erweiterte Nährstoffe
    fiber: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Ballaststoffe (g) pro 100g'
    },
    sugar: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Zucker (g) pro 100g'
    },
    sodium: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0,
      comment: 'Natrium (mg) pro 100g'
    },
    
    // Vitamine (µg pro 100g)
    vitamin_a: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_c: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_d: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_e: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_k: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_b1: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_b2: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_b3: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_b6: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    vitamin_b12: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    folate: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    
    // Mineralien (mg pro 100g)
    calcium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    iron: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    magnesium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    phosphorus: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    potassium: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    zinc: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    
    // Dietary Flags
    is_vegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_vegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_gluten_free: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_lactose_free: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_organic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // AI/Verification
    nutrition_source: {
      type: DataTypes.ENUM('manual', 'ai', 'usda', 'api', 'verified'),
      defaultValue: 'manual'
    },
    ai_analyzed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ai_confidence_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'AI confidence 0-100'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who verified'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    if (this.entity_type === 'ingredient') {
      return await models.Ingredient.findByPk(this.entity_id);
    } else if (this.entity_type === 'product') {
      return await models.Product.findByPk(this.entity_id);
    }
    return null;
  };

  return Nutrition;
};