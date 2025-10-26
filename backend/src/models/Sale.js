// backend/src/models/Sale.js
// Fixed Sale Model with consistent naming conventions

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sale = sequelize.define('Sale', {
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
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
      validate: {
        min: 0
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price',
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'online', 'invoice'),
      defaultValue: 'cash',
      field: 'payment_method'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
      defaultValue: 'completed'
    },
    saleDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sale_date',
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referenceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'reference_number'
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['user_id'] },
      { fields: ['sale_date'] },
      { fields: ['status'] },
      { fields: ['payment_method'] },
      { fields: ['reference_number'] }
    ]
  });

  // Associations
  Sale.associate = (models) => {
    Sale.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });

    Sale.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  // Hooks
  Sale.beforeCreate(async (sale) => {
    // Auto-generate reference number if not provided
    if (!sale.referenceNumber) {
      const date = new Date();
      const timestamp = date.getTime();
      sale.referenceNumber = `INV-${timestamp}`;
    }

    // Calculate total if not provided
    if (!sale.totalPrice) {
      sale.totalPrice = (parseFloat(sale.unitPrice) * sale.quantity) 
                        - parseFloat(sale.discount || 0) 
                        + parseFloat(sale.tax || 0);
    }
  });

  // Instance Methods
  Sale.prototype.calculateTotal = function() {
    const subtotal = parseFloat(this.unitPrice) * this.quantity;
    const discount = parseFloat(this.discount || 0);
    const tax = parseFloat(this.tax || 0);
    
    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal - discount + tax).toFixed(2)
    };
  };

  Sale.prototype.cancel = async function(reason) {
    if (this.status === 'cancelled') {
      throw new Error('Sale is already cancelled');
    }

    await this.update({
      status: 'cancelled',
      notes: `${this.notes || ''}\nCancelled: ${reason}`
    });

    // Restore ingredient stock
    const models = require('./index');
    const product = await models.Product.findByPk(this.productId);
    
    if (product) {
      const recipe = await product.getRecipe();
      
      for (const item of recipe) {
        if (item.ingredient) {
          const quantityToRestore = parseFloat(item.quantity) * this.quantity;
          await item.ingredient.updateStock(quantityToRestore, 'add');
        }
      }
    }

    return this;
  };

  Sale.prototype.refund = async function(amount, reason) {
    if (this.status !== 'completed') {
      throw new Error('Only completed sales can be refunded');
    }

    await this.update({
      status: 'refunded',
      notes: `${this.notes || ''}\nRefunded ${amount}: ${reason}`
    });

    return this;
  };

  // Class Methods
  Sale.getSalesByDateRange = async function(startDate, endDate) {
    return await Sale.findAll({
      where: {
        saleDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: sequelize.models.Product,
          as: 'product'
        },
        {
          model: sequelize.models.User,
          as: 'user'
        }
      ],
      order: [['saleDate', 'DESC']]
    });
  };

  Sale.getDailySummary = async function(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Sale.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalItems'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_price')), 'avgSaleValue']
      ],
      where: {
        saleDate: {
          [sequelize.Op.between]: [startOfDay, endOfDay]
        },
        status: 'completed'
      },
      raw: true
    });

    return result[0];
  };

  Sale.getTopProducts = async function(startDate, endDate, limit = 10) {
    const results = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(s.id) as sale_count,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_price) as total_revenue
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
        AND s.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT :limit
    `, {
      replacements: { startDate, endDate, limit },
      type: sequelize.QueryTypes.SELECT
    });

    return results;
  };

  Sale.getRevenueByPaymentMethod = async function(startDate, endDate) {
    return await Sale.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue']
      ],
      where: {
        saleDate: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      group: ['paymentMethod'],
      raw: true
    });
  };

  return Sale;
};