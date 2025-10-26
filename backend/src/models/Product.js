// backend/src/models/Product.js
// Fixed Product Model with UUID and Recipe fields

const { DataTypes } = require('sequelize');

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
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
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
      validate: {
        min: 0
      }
    },
    
    // Recipe-related fields (no separate Recipe table needed!)
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
    
    // Display & Media
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    
    // Status
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
      { fields: ['name'] },
      { fields: ['category_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  // Associations
  Product.associate = (models) => {
    // Belongs to Category
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    // Has many ingredients through ProductIngredient
    Product.belongsToMany(models.Ingredient, {
      through: models.ProductIngredient,
      foreignKey: 'productId',
      as: 'ingredients'
    });

    // Has many sales
    Product.hasMany(models.Sale, {
      foreignKey: 'productId',
      as: 'sales'
    });

    // Has many forecast items
    Product.hasMany(models.ForecastItem, {
      foreignKey: 'productId',
      as: 'forecastItems'
    });

    // Has one nutrition (polymorphic)
    Product.hasOne(models.Nutrition, {
      foreignKey: 'entityId',
      constraints: false,
      scope: {
        entityType: 'product'
      },
      as: 'nutrition'
    });
  };

  // Instance Methods
  Product.prototype.getRecipe = async function() {
    const models = require('./index');
    return await models.ProductIngredient.findAll({
      where: { productId: this.id },
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
      ],
      order: [['createdAt', 'ASC']]
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
      if (item.ingredient?.nutrition) {
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
          required: required,
          available: available,
          unit: item.unit,
          isAvailable: isAvailable,
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

  // Class Methods
  Product.getActiveProducts = async function() {
    return await Product.findAll({
      where: { isActive: true },
      include: [
        {
          model: sequelize.models.Category,
          as: 'category'
        },
        {
          model: sequelize.models.Ingredient,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit'] }
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
  };

  Product.getByCategory = async function(categoryId) {
    return await Product.findAll({
      where: { 
        categoryId: categoryId,
        isActive: true
      },
      include: [
        {
          model: sequelize.models.Category,
          as: 'category'
        }
      ]
    });
  };

  return Product;
};