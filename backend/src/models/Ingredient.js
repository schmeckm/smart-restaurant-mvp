// backend/src/models/Ingredient.js
// Ingredient Model + Multi-Tenant Support + costPerUnit Alias

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Ingredient:
 *       type: object
 *       description: Zutat im Restaurant inklusive Lagerbestand, Preis und Nährwertverknüpfung
 *       required:
 *         - name
 *         - category
 *         - restaurantId
 *         - unit
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "9b2f4a6d-83a3-4d21-bfb5-9b7a3b97a0a7"
 *         name:
 *           type: string
 *           example: "Tomaten"
 *         description:
 *           type: string
 *           example: "Frische Bio-Tomaten aus Italien"
 *         category:
 *           type: string
 *           enum: [vegetable, meat, dairy, spice, other]
 *           example: "vegetable"
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           example: "ae12bc34-de56-78f9-ab12-34cd56ef7890"
 *           description: Zugehörige Restaurant-ID (Multi-Tenant)
 *         unit:
 *           type: string
 *           example: "g"
 *         pricePerUnit:
 *           type: number
 *           format: float
 *           example: 1.50
 *         costPerUnit:
 *           type: number
 *           format: float
 *           example: 1.50
 *           description: Alias für pricePerUnit (Kompatibilität)
 *         stockQuantity:
 *           type: number
 *           example: 2500
 *           description: Aktueller Lagerbestand in Einheiten (z. B. g oder ml)
 *         minStockLevel:
 *           type: number
 *           example: 500
 *           description: Mindestlagerbestand zur Nachbestellung
 *         supplier:
 *           type: string
 *           example: "Fruchtimport GmbH"
 *         allergens:
 *           type: array
 *           items:
 *             type: string
 *           example: ["gluten"]
 *         isActive:
 *           type: boolean
 *           example: true
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
  const Ingredient = sequelize.define(
    'Ingredient',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM('vegetable', 'meat', 'dairy', 'spice', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
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
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'g'
      },
      pricePerUnit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'price_per_unit'
      },
      // ✅ Alias-Feld für Kompatibilität mit costPerUnit (Frontend & Forecast)
      costPerUnit: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('pricePerUnit');
        },
        set(value) {
          this.setDataValue('pricePerUnit', value);
        }
      },
      stockQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'stock_quantity'
      },
      minStockLevel: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'min_stock_level'
      },
      supplier: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      allergens: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      }
    },
    {
      tableName: 'ingredients',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['name', 'restaurant_id'], name: 'idx_ingredients_name_restaurant' },
        { fields: ['restaurant_id'], name: 'idx_ingredients_restaurant_id' },
        { fields: ['is_active'], name: 'idx_ingredients_is_active' }
      ]
    }
  );

  // ===============================
  // 🔗 Associations
  // ===============================
  Ingredient.associate = (models) => {
    if (models.Restaurant) {
      Ingredient.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }

    if (models.Product && models.ProductIngredient) {
      Ingredient.belongsToMany(models.Product, {
        through: models.ProductIngredient,
        foreignKey: 'ingredientId',
        as: 'products'
      });
    }

    if (models.Nutrition) {
      Ingredient.hasOne(models.Nutrition, {
        foreignKey: 'entityId',
        constraints: false,
        scope: {
          entityType: 'ingredient'
        },
        as: 'nutrition'
      });
    }
  };

  // ===============================
  // 🔹 Instance Methods
  // ===============================
  Ingredient.prototype.isLowStock = function () {
    return parseFloat(this.stockQuantity) <= parseFloat(this.minStockLevel);
  };

  Ingredient.prototype.addStock = async function (quantity) {
    this.stockQuantity = parseFloat(this.stockQuantity) + parseFloat(quantity);
    await this.save();
    return this;
  };

  Ingredient.prototype.removeStock = async function (quantity) {
    const newQuantity = parseFloat(this.stockQuantity) - parseFloat(quantity);
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }
    this.stockQuantity = newQuantity;
    await this.save();
    return this;
  };

  // ===============================
  // 🔹 Class Methods
  // ===============================
  Ingredient.getLowStockItems = async function (restaurantId = null) {
    const where = { isActive: true };
    if (restaurantId) where.restaurantId = restaurantId;

    const ingredients = await Ingredient.findAll({ where });
    return ingredients.filter((ing) => ing.isLowStock());
  };

  Ingredient.getByAllergen = async function (allergen, restaurantId = null) {
    const where = {
      allergens: { [sequelize.Sequelize.Op.contains]: [allergen] },
      isActive: true
    };
    if (restaurantId) where.restaurantId = restaurantId;

    return await Ingredient.findAll({ where });
  };

  return Ingredient;
};
