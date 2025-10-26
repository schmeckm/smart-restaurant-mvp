// backend/src/models/ProductIngredient.js
// Fixed Junction Table for M:N between Products and Ingredients (Recipes)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductIngredient = sequelize.define('ProductIngredient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ingredientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'ingredient_id',
      references: {
        model: 'ingredients',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    unit: {
      type: DataTypes.ENUM('g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup'),
      allowNull: false,
      defaultValue: 'g'
    },
    preparationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'preparation_note'
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_optional'
    },
    substituteFor: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'substitute_for'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    }
  }, {
    tableName: 'product_ingredients',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'ingredient_id']
      },
      { fields: ['product_id'] },
      { fields: ['ingredient_id'] },
      { fields: ['sort_order'] }
    ]
  });

  // Associations
  ProductIngredient.associate = (models) => {
    ProductIngredient.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });

    ProductIngredient.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  };

  // Instance Methods
  ProductIngredient.prototype.calculateCost = function() {
    if (!this.ingredient) return 0;
    
    const quantity = parseFloat(this.quantity);
    const pricePerUnit = parseFloat(this.ingredient.pricePerUnit);
    
    return quantity * pricePerUnit;
  };

  ProductIngredient.prototype.checkAvailability = function() {
    if (!this.ingredient) return false;
    
    const required = parseFloat(this.quantity);
    const available = parseFloat(this.ingredient.stockQuantity);
    
    return available >= required;
  };

  ProductIngredient.prototype.getNutritionContribution = async function() {
    const models = require('./index');
    
    if (!this.ingredientId) return null;

    const nutrition = await models.Nutrition.findOne({
      where: {
        entityType: 'ingredient',
        entityId: this.ingredientId
      }
    });

    if (!nutrition) return null;

    // Calculate nutrition based on quantity used (nutrition is per 100g)
    const factor = parseFloat(this.quantity) / 100;

    return {
      ingredientName: this.ingredient?.name,
      quantity: this.quantity,
      unit: this.unit,
      calories: parseFloat(nutrition.calories || 0) * factor,
      protein: parseFloat(nutrition.protein || 0) * factor,
      fat: parseFloat(nutrition.fat || 0) * factor,
      carbs: parseFloat(nutrition.carbs || 0) * factor,
      fiber: parseFloat(nutrition.fiber || 0) * factor,
      sugar: parseFloat(nutrition.sugar || 0) * factor,
      sodium: parseFloat(nutrition.sodium || 0) * factor
    };
  };

  ProductIngredient.prototype.convertUnit = function(targetUnit) {
    // Simple unit conversion (can be extended)
    const conversions = {
      'g_kg': 1000,
      'kg_g': 0.001,
      'ml_l': 1000,
      'l_ml': 0.001
    };

    const key = `${this.unit}_${targetUnit}`;
    const factor = conversions[key];

    if (!factor) {
      throw new Error(`Cannot convert ${this.unit} to ${targetUnit}`);
    }

    return parseFloat(this.quantity) * factor;
  };

  // Class Methods
  ProductIngredient.getRecipeForProduct = async function(productId) {
    return await ProductIngredient.findAll({
      where: { productId: productId },
      include: [
        {
          model: sequelize.models.Ingredient,
          as: 'ingredient',
          include: [
            {
              model: sequelize.models.Nutrition,
              as: 'nutrition',
              required: false
            }
          ]
        }
      ],
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
  };

  ProductIngredient.getProductsUsingIngredient = async function(ingredientId) {
    return await ProductIngredient.findAll({
      where: { ingredientId: ingredientId },
      include: [
        {
          model: sequelize.models.Product,
          as: 'product',
          where: { isActive: true }
        }
      ]
    });
  };

  ProductIngredient.getMostUsedIngredients = async function(limit = 10) {
    const results = await sequelize.query(`
      SELECT 
        i.id,
        i.name,
        i.unit,
        i.stock_quantity,
        i.min_stock,
        COUNT(DISTINCT pi.product_id) as product_count,
        SUM(pi.quantity) as total_quantity_used,
        AVG(pi.quantity) as avg_quantity_per_product
      FROM ingredients i
      INNER JOIN product_ingredients pi ON i.id = pi.ingredient_id
      INNER JOIN products p ON pi.product_id = p.id AND p.is_active = true
      WHERE i.is_active = true
      GROUP BY i.id, i.name, i.unit, i.stock_quantity, i.min_stock
      ORDER BY product_count DESC, total_quantity_used DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT
    });

    return results;
  };

  ProductIngredient.checkBulkAvailability = async function(orders) {
    // orders format: [{ productId, quantity }, ...]
    const models = require('./index');
    
    const ingredientNeeds = {};
    
    for (const order of orders) {
      const recipe = await ProductIngredient.getRecipeForProduct(order.productId);
      
      for (const item of recipe) {
        const key = item.ingredientId;
        const needed = parseFloat(item.quantity) * order.quantity;
        
        if (!ingredientNeeds[key]) {
          ingredientNeeds[key] = {
            ingredientId: key,
            ingredientName: item.ingredient?.name,
            unit: item.unit,
            totalNeeded: 0,
            available: parseFloat(item.ingredient?.stockQuantity || 0)
          };
        }
        
        ingredientNeeds[key].totalNeeded += needed;
      }
    }

    // Check availability
    return Object.values(ingredientNeeds).map(item => ({
      ...item,
      isAvailable: item.available >= item.totalNeeded,
      shortage: Math.max(0, item.totalNeeded - item.available)
    }));
  };

  return ProductIngredient;
};