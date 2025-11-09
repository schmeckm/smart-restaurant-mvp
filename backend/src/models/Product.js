// backend/src/models/Product.js
// MULTI-TENANT SECURE Product Model with UUID and Recipe fields

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       description: Produkt / Gericht eines Restaurants, inklusive Preis, Zutaten und Nährwertinformationen
 *       required:
 *         - name
 *         - restaurantId
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "b47c8a5e-9247-41bb-bc25-f3e0f7cb3bfa"
 *         name:
 *           type: string
 *           example: "Spaghetti Bolognese"
 *         description:
 *           type: string
 *           example: "Hausgemachte Pasta mit Rindfleischsauce"
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           example: "a9b5d6e7-42c8-4c93-b7ad-11b28a4e8821"
 *           description: Zugehöriges Restaurant (Multi-Tenant)
 *         categoryId:
 *           type: string
 *           format: uuid
 *           example: "f83a3b9b-9f8e-4b8f-b98a-2381c43eeb45"
 *           description: Kategorie (z. B. Pasta, Dessert)
 *         price:
 *           type: number
 *           example: 14.50
 *           description: Verkaufspreis des Produkts
 *         cost:
 *           type: number
 *           example: 5.25
 *           description: Kalkulierter Material- und Rezeptkostenpreis
 *         instructions:
 *           type: string
 *           example: "Zwiebeln anbraten, Hackfleisch hinzufügen, Sauce 20 Minuten köcheln lassen."
 *         prepTime:
 *           type: integer
 *           example: 15
 *           description: Vorbereitungszeit in Minuten
 *         cookTime:
 *           type: integer
 *           example: 30
 *           description: Kochzeit in Minuten
 *         servings:
 *           type: integer
 *           example: 2
 *           description: Portionen pro Rezept
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: "medium"
 *         imageUrl:
 *           type: string
 *           example: "https://cdn.example.com/images/spaghetti-bolognese.jpg"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["italian", "pasta", "beef"]
 *         isActive:
 *           type: boolean
 *           example: true
 *         sortOrder:
 *           type: integer
 *           example: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-31T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-31T11:30:00Z"
 */

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // ========== MULTI-TENANT: Restaurant Reference ==========
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // =========================================================
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: { min: 0 }
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prepTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'prep_time'
    },
    cookTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cook_time'
    },
    servings: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name', 'restaurant_id'], name: 'idx_products_name_restaurant' },
      { fields: ['restaurant_id'], name: 'idx_products_restaurant_id' },
      { fields: ['category_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  // ===============================
  // 🔗 Associations
  // ===============================
  Product.associate = (models) => {
    if (models.Restaurant) {
      Product.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }

    if (models.Category) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }

    if (models.Ingredient && models.ProductIngredient) {
      Product.belongsToMany(models.Ingredient, {
        through: models.ProductIngredient,
        foreignKey: 'productId',
        as: 'ingredients'
      });
    }

    if (models.Sale) {
      Product.hasMany(models.Sale, {
        foreignKey: 'productId',
        as: 'sales'
      });
    }

    if (models.ForecastItem) {
      Product.hasMany(models.ForecastItem, {
        foreignKey: 'productId',
        as: 'forecastItems'
      });
    }

    if (models.Nutrition) {
      Product.hasOne(models.Nutrition, {
        foreignKey: 'entityId',
        constraints: false,
        scope: { entityType: 'product' },
        as: 'nutrition'
      });
    }
  };

  // ===============================
  // 🔹 Instance Methods
  // ===============================
  Product.prototype.getRecipe = async function() {
    const models = require('./index');
    return await models.ProductIngredient.findAll({
      where: { productId: this.id },
      include: [
        {
          model: models.Ingredient,
          as: 'ingredient',
          include: [{ model: models.Nutrition, as: 'nutrition', required: false }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
  };

  Product.prototype.calculateNutrition = async function() {
    const recipe = await this.getRecipe();
    const nutrition = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 };

    for (const item of recipe) {
      if (item.ingredient?.nutrition) {
        const n = item.ingredient.nutrition;
        const factor = parseFloat(item.quantity) / 100;
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
        const cost = parseFloat(item.quantity) * parseFloat(item.ingredient.pricePerUnit);
        totalCost += cost;
      }
    }
    return totalCost;
  };

  Product.prototype.getMargin = async function() {
    const cost = await this.calculateCost();
    const price = parseFloat(this.price);
    const profit = price - cost;
    const margin = cost > 0 ? (profit / price) * 100 : 0;

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
        const available = parseFloat(item.ingredient.stockQuantity);
        const isAvailable = available >= required;

        availability.push({
          ingredientId: item.ingredient.id,
          ingredientName: item.ingredient.name,
          required,
          available,
          unit: item.unit,
          isAvailable,
          missing: isAvailable ? 0 : required - available
        });
      }
    }

    return availability;
  };

  Product.prototype.getTotalTime = function() {
    const prep = this.prepTime || 0;
    const cook = this.cookTime || 0;
    return prep + cook;
  };

  // ===============================
  // 🔹 Class Methods
  // ===============================
  Product.getActiveProducts = async function(restaurantId) {
    return await Product.findAll({
      where: { isActive: true, restaurantId },
      include: [
        { model: sequelize.models.Category, as: 'category' },
        { model: sequelize.models.Ingredient, as: 'ingredients', through: { attributes: ['quantity', 'unit'] } }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
  };

  Product.getByCategory = async function(categoryId, restaurantId) {
    return await Product.findAll({
      where: { categoryId, restaurantId, isActive: true },
      include: [{ model: sequelize.models.Category, as: 'category' }]
    });
  };

  return Product;
};
