// backend/src/models/Sale.js
// ✅ Vollständiges Sale Model mit ENUM-Status + Multi-Tenant Support

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       description: Verkaufstransaktion für ein Produkt in einem Restaurant
 *       required:
 *         - productId
 *         - restaurantId
 *         - quantity
 *         - unitPrice
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "d7f8e5a4-12c3-4b56-9a7e-1c9a9f3e8b77"
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Zugehöriges Produkt (Gericht)
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Benutzer, der den Verkauf erfasst hat
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           description: Zugehöriges Restaurant (Mandant)
 *         quantity:
 *           type: number
 *           example: 3
 *         unitPrice:
 *           type: number
 *           example: 12.50
 *         totalPrice:
 *           type: number
 *           example: 37.50
 *         saleDate:
 *           type: string
 *           format: date-time
 *           example: "2025-10-31T18:30:00Z"
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: "pending"
 *         notes:
 *           type: string
 *           example: "Happy Hour Rabatt angewendet"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = (sequelize) => {
  const Sale = sequelize.define(
    'Sale',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: { model: 'products', key: 'id' },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
      },
      restaurantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'restaurant_id',
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'CASCADE',
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_price',
      },
      saleDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'sale_date',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'sales',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['product_id'], name: 'idx_sales_product_id' },
        { fields: ['user_id'], name: 'idx_sales_user_id' },
        { fields: ['restaurant_id'], name: 'idx_sales_restaurant_id' },
        { fields: ['sale_date'], name: 'idx_sales_sale_date' },
        { fields: ['restaurant_id', 'sale_date'], name: 'idx_sales_restaurant_date' },
      ],
    }
  );

  // ===============================
  // 🔗 Associations
  // ===============================
  Sale.associate = (models) => {
    if (models.Restaurant) {
      Sale.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant',
      });
    }
    if (models.Product) {
      Sale.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
      });
    }
    if (models.User) {
      Sale.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  };

  // ===============================
  // 🔹 Hooks
  // ===============================
  Sale.beforeCreate(async (sale) => {
    if (sale.quantity && sale.unitPrice) {
      sale.totalPrice = parseFloat(sale.quantity) * parseFloat(sale.unitPrice);
    }
    if (!sale.status) {
      sale.status = 'pending';
    }
  });

  Sale.beforeUpdate(async (sale) => {
    if (sale.changed('quantity') || sale.changed('unitPrice')) {
      sale.totalPrice = parseFloat(sale.quantity) * parseFloat(sale.unitPrice);
    }
  });

  // ===============================
  // 🔹 Class Methods
  // ===============================
  Sale.getSalesByDateRange = async function (startDate, endDate, restaurantId = null) {
    const where = {
      saleDate: { [sequelize.Sequelize.Op.between]: [startDate, endDate] },
    };
    if (restaurantId) where.restaurantId = restaurantId;

    return await Sale.findAll({
      where,
      include: [
        { model: sequelize.models.Product, as: 'product' },
        { model: sequelize.models.User, as: 'user' },
      ],
      order: [['saleDate', 'DESC']],
    });
  };

  Sale.getTotalRevenue = async function (startDate, endDate, restaurantId = null) {
    const where = {
      saleDate: { [sequelize.Sequelize.Op.between]: [startDate, endDate] },
    };
    if (restaurantId) where.restaurantId = restaurantId;
    const result = await Sale.sum('totalPrice', { where });
    return result || 0;
  };

  Sale.getTopSellingProducts = async function (limit = 10, restaurantId = null) {
    const where = {};
    if (restaurantId) where.restaurantId = restaurantId;

    return await Sale.findAll({
      where,
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
      ],
      include: [{ model: sequelize.models.Product, as: 'product', attributes: ['name', 'price'] }],
      group: ['productId', 'product.id'],
      order: [[sequelize.literal('totalQuantity'), 'DESC']],
      limit,
    });
  };

  return Sale;
};
