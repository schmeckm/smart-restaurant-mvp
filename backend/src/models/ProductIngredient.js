// backend/models/ProductIngredient.js
// Junction Table für M:N Beziehung zwischen Products und Ingredients (Rezepte)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductIngredient = sequelize.define('ProductIngredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    ingredient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ingredients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Menge die für dieses Gericht benötigt wird'
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Einheit (g, ml, Stück, etc.)'
    },
    preparation_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'z.B. "fein gehackt", "gewürfelt", etc.'
    },
    is_optional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Ist diese Zutat optional?'
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
      {
        fields: ['product_id']
      },
      {
        fields: ['ingredient_id']
      }
    ]
  });

  // Associations
  ProductIngredient.associate = (models) => {
    ProductIngredient.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });

    ProductIngredient.belongsTo(models.Ingredient, {
      foreignKey: 'ingredient_id',
      as: 'ingredient'
    });
  };

  // Instance Methods
  ProductIngredient.prototype.calculateCost = function() {
    if (!this.ingredient) return 0;
    return parseFloat(this.quantity) * parseFloat(this.ingredient.price_per_unit);
  };

  ProductIngredient.prototype.checkAvailability = function() {
    if (!this.ingredient) return false;
    return parseFloat(this.ingredient.stock_quantity) >= parseFloat(this.quantity);
  };

  ProductIngredient.prototype.getNutritionContribution = async function() {
    const models = require('./index');
    
    if (!this.ingredient_id) return null;

    const nutrition = await models.Nutrition.findOne({
      where: {
        entity_type: 'ingredient',
        entity_id: this.ingredient_id
      }
    });

    if (!nutrition) return null;

    // Berechne Nährstoffe basierend auf der verwendeten Menge
    const factor = parseFloat(this.quantity) / 100; // nutrition ist per 100g

    return {
      calories: parseFloat(nutrition.calories || 0) * factor,
      protein: parseFloat(nutrition.protein || 0) * factor,
      fat: parseFloat(nutrition.fat || 0) * factor,
      carbs: parseFloat(nutrition.carbs || 0) * factor,
      fiber: parseFloat(nutrition.fiber || 0) * factor,
      sugar: parseFloat(nutrition.sugar || 0) * factor,
      sodium: parseFloat(nutrition.sodium || 0) * factor
    };
  };

  // Class Methods
  ProductIngredient.getRecipeForProduct = async function(productId) {
    return await ProductIngredient.findAll({
      where: { product_id: productId },
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
      order: [['ingredient', 'name', 'ASC']]
    });
  };

  ProductIngredient.getProductsUsingIngredient = async function(ingredientId) {
    return await ProductIngredient.findAll({
      where: { ingredient_id: ingredientId },
      include: [
        {
          model: sequelize.models.Product,
          as: 'product'
        }
      ]
    });
  };

  ProductIngredient.getMostUsedIngredients = async function(limit = 10) {
    const results = await sequelize.query(`
      SELECT 
        i.id,
        i.name,
        COUNT(DISTINCT pi.product_id) as product_count,
        SUM(pi.quantity) as total_quantity
      FROM ingredients i
      LEFT JOIN product_ingredients pi ON i.id = pi.ingredient_id
      GROUP BY i.id, i.name
      ORDER BY product_count DESC, total_quantity DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT
    });

    return results;
  };

  return ProductIngredient;
};