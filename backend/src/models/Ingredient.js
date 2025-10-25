// backend/models/Ingredient.js
// Ingredient Model OHNE Nutrition-Felder (die sind jetzt in separater Tabelle)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ingredient = sequelize.define('Ingredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Einheit: g, ml, kg, l, Stück, etc.'
    },
    price_per_unit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Preis pro Einheit (z.B. pro g, pro ml)'
    },
    stock_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Aktueller Lagerbestand'
    },
    min_stock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Mindestbestand (für Warnungen)'
    },
    supplier: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Lieferant/Hersteller'
    }
  }, {
    tableName: 'ingredients',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['supplier']
      }
    ]
  });

  // Associations
  Ingredient.associate = (models) => {
    // M:N mit Products über ProductIngredient
    Ingredient.belongsToMany(models.Product, {
      through: models.ProductIngredient,
      foreignKey: 'ingredient_id',
      as: 'products'
    });

    // 1:1 mit Nutrition (polymorphic)
    Ingredient.hasOne(models.Nutrition, {
      foreignKey: 'entity_id',
      constraints: false,
      scope: {
        entity_type: 'ingredient'
      },
      as: 'nutrition'
    });
  };

  // Instance Methods
  Ingredient.prototype.getNutrition = async function() {
    const models = require('./index');
    return await models.Nutrition.findOne({
      where: {
        entity_type: 'ingredient',
        entity_id: this.id
      }
    });
  };

  Ingredient.prototype.isLowStock = function() {
    return this.stock_quantity <= this.min_stock;
  };

  Ingredient.prototype.getTotalValue = function() {
    return parseFloat(this.stock_quantity) * parseFloat(this.price_per_unit);
  };

  // Class Methods
  Ingredient.getLowStockIngredients = async function() {
    return await Ingredient.findAll({
      where: sequelize.literal('stock_quantity <= min_stock')
    });
  };

  return Ingredient;
};