// backend/models/Product.js
// Product Model (Gerichte/Speisekarte)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'z.B. Pizza, Pasta, Hauptgericht, Dessert'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Ist das Gericht aktuell verfügbar?'
    },
    serving_size: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Portionsgröße in Gramm'
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['category']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Associations
  Product.associate = (models) => {
    // M:N mit Ingredients über ProductIngredient
    Product.belongsToMany(models.Ingredient, {
      through: models.ProductIngredient,
      foreignKey: 'product_id',
      as: 'ingredients'
    });

    // 1:N mit Sales
    Product.hasMany(models.Sale, {
      foreignKey: 'product_id',
      as: 'sales'
    });

    // 1:1 mit Nutrition (polymorphic)
    Product.hasOne(models.Nutrition, {
      foreignKey: 'entity_id',
      constraints: false,
      scope: {
        entity_type: 'product'
      },
      as: 'nutrition'
    });
  };

  // Instance Methods
  Product.prototype.getRecipe = async function() {
    const models = require('./index');
    return await models.ProductIngredient.findAll({
      where: { product_id: this.id },
      include: [
        {
          model: models.Ingredient,
          as: 'ingredient',
          include: [
            {
              model: models.Nutrition,
              as: 'nutrition',
              required: false
            }
          ]
        }
      ]
    });
  };

  Product.prototype.calculateNutrition = async function() {
    const recipe = await this.getRecipe();
    
    const nutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    for (const item of recipe) {
      if (item.ingredient && item.ingredient.nutrition) {
        const n = item.ingredient.nutrition;
        const factor = parseFloat(item.quantity) / 100; // per 100g

        nutrition.calories += parseFloat(n.calories || 0) * factor;
        nutrition.protein += parseFloat(n.protein || 0) * factor;
        nutrition.fat += parseFloat(n.fat || 0) * factor;
        nutrition.carbs += parseFloat(n.carbs || 0) * factor;
        nutrition.fiber += parseFloat(n.fiber || 0) * factor;
        nutrition.sugar += parseFloat(n.sugar || 0) * factor;
        nutrition.sodium += parseFloat(n.sodium || 0) * factor;
      }
    }

    return nutrition;
  };

  Product.prototype.calculateCost = async function() {
    const recipe = await this.getRecipe();
    
    let totalCost = 0;
    for (const item of recipe) {
      if (item.ingredient) {
        const cost = parseFloat(item.quantity) * parseFloat(item.ingredient.price_per_unit);
        totalCost += cost;
      }
    }

    return totalCost;
  };

  Product.prototype.getMargin = async function() {
    const cost = await this.calculateCost();
    const price = parseFloat(this.price);
    const profit = price - cost;
    const margin = (profit / price) * 100;
    
    return {
      cost: cost.toFixed(2),
      price: price.toFixed(2),
      profit: profit.toFixed(2),
      margin: margin.toFixed(2)
    };
  };

  Product.prototype.checkIngredientsAvailability = async function(quantity = 1) {
    const recipe = await this.getRecipe();
    const availability = [];

    for (const item of recipe) {
      if (item.ingredient) {
        const required = parseFloat(item.quantity) * quantity;
        const available = parseFloat(item.ingredient.stock_quantity);
        const isAvailable = available >= required;

        availability.push({
          ingredient: item.ingredient.name,
          required: required,
          available: available,
          isAvailable: isAvailable,
          missing: isAvailable ? 0 : required - available
        });
      }
    }

    return availability;
  };

  // Class Methods
  Product.getActiveProducts = async function() {
    return await Product.findAll({
      where: { is_active: true },
      include: [
        {
          model: sequelize.models.Ingredient,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit'] }
        }
      ]
    });
  };

  Product.getByCategory = async function(category) {
    return await Product.findAll({
      where: { 
        category: category,
        is_active: true
      }
    });
  };

  return Product;
};