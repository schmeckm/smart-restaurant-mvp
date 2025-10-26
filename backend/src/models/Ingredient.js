// backend/src/models/Ingredient.js
// Fixed Ingredient Model with UUID and Nutrition support

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ingredient = sequelize.define('Ingredient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    unit: {
      type: DataTypes.ENUM('g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup'),
      allowNull: false,
      defaultValue: 'g'
    },
    
    // Pricing & Stock
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 0,
      field: 'price_per_unit'
    },
    stockQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'stock_quantity'
    },
    minStock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'min_stock'
    },
    
    // Supplier Info
    supplier: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    supplierCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'supplier_code'
    },
    
    // Additional Info
    allergens: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    storageInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'storage_info'
    },
    shelfLife: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'shelf_life'
    },
    
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'ingredients',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['supplier'] },
      { fields: ['is_active'] },
      {
        name: 'low_stock_idx',
        fields: ['stock_quantity', 'min_stock'],
        where: sequelize.literal('"is_active" = true')
      }
    ]
  });

  // Associations
  Ingredient.associate = (models) => {
    // Many-to-Many with Products through ProductIngredient
    Ingredient.belongsToMany(models.Product, {
      through: models.ProductIngredient,
      foreignKey: 'ingredientId',
      as: 'products'
    });

    // One-to-One with Nutrition (polymorphic)
    Ingredient.hasOne(models.Nutrition, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'nutrition'
    });
  };

  // Instance Methods
  Ingredient.prototype.getNutrition = async function() {
    const models = require('./index');
    return await models.Nutrition.findOne({
      where: {
        entityType: 'ingredient',
        entityId: this.id
      }
    });
  };

  Ingredient.prototype.isLowStock = function() {
    return parseFloat(this.stockQuantity) <= parseFloat(this.minStock);
  };

  Ingredient.prototype.getTotalValue = function() {
    return parseFloat(this.stockQuantity) * parseFloat(this.pricePerUnit);
  };

  Ingredient.prototype.getUsageInProducts = async function() {
    const models = require('./index');
    const usage = await models.ProductIngredient.findAll({
      where: { ingredientId: this.id },
      include: [
        {
          model: models.Product,
          as: 'product',
          where: { isActive: true }
        }
      ]
    });

    return usage.map(u => ({
      productId: u.product.id,
      productName: u.product.name,
      quantity: u.quantity,
      unit: u.unit
    }));
  };

  Ingredient.prototype.updateStock = async function(quantity, operation = 'add') {
    const currentStock = parseFloat(this.stockQuantity);
    const changeAmount = parseFloat(quantity);

    let newStock;
    if (operation === 'add') {
      newStock = currentStock + changeAmount;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, currentStock - changeAmount);
    } else {
      newStock = changeAmount; // set directly
    }

    await this.update({ stockQuantity: newStock });
    return newStock;
  };

  // Class Methods
  Ingredient.getLowStockIngredients = async function() {
    return await Ingredient.findAll({
      where: sequelize.literal('"stock_quantity" <= "min_stock"'),
      include: [
        {
          model: sequelize.models.Nutrition,
          as: 'nutrition',
          required: false
        }
      ],
      order: [
        [sequelize.literal('"stock_quantity" / NULLIF("min_stock", 0)'), 'ASC']
      ]
    });
  };

  Ingredient.getTotalInventoryValue = async function() {
    const result = await Ingredient.findAll({
      attributes: [
        [sequelize.fn('SUM', 
          sequelize.literal('"stock_quantity" * "price_per_unit"')
        ), 'totalValue']
      ],
      where: { isActive: true },
      raw: true
    });

    return parseFloat(result[0]?.totalValue || 0);
  };

  Ingredient.getByAllergen = async function(allergen) {
    return await Ingredient.findAll({
      where: {
        allergens: {
          [sequelize.Op.contains]: [allergen]
        },
        isActive: true
      }
    });
  };

  Ingredient.getMostUsed = async function(limit = 10) {
    const models = require('./index');
    
    const results = await sequelize.query(`
      SELECT 
        i.id,
        i.name,
        i.unit,
        i.stock_quantity,
        i.min_stock,
        COUNT(DISTINCT pi.product_id) as product_count,
        SUM(pi.quantity) as total_quantity_used
      FROM ingredients i
      LEFT JOIN product_ingredients pi ON i.id = pi.ingredient_id
      LEFT JOIN products p ON pi.product_id = p.id AND p.is_active = true
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

  return Ingredient;
};