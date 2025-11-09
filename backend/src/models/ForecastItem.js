// backend/src/models/ForecastItem.js
// Forecast Item Model - Individual forecast entries per product per period

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     ForecastItem:
 *       type: object
 *       description: Einzelner Forecast-Eintrag pro Produkt und Zeitraum
 *       required:
 *         - versionId
 *         - productId
 *         - periodIndex
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f9a4b42e-78e3-4e8d-9b75-5fdce1cce999"
 *         versionId:
 *           type: string
 *           format: uuid
 *           example: "b44c2b7a-4599-4129-8b3d-df1dc50c128a"
 *           description: ID der Forecast-Version
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "8c2f438a-6a5b-4a6c-a733-5f8b7dc6718e"
 *           description: Zugehöriges Produkt
 *         periodIndex:
 *           type: integer
 *           example: 42
 *           description: Periodenzähler (z. B. Woche oder Monat)
 *         periodLabel:
 *           type: string
 *           example: "KW 42 / 2025"
 *           description: Menschlich lesbarer Periodenname
 *         quantity:
 *           type: number
 *           example: 120.5
 *           description: Prognostizierte Menge für dieses Produkt in dieser Periode
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
  const ForecastItem = sequelize.define('ForecastItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    versionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'version_id',
      references: {
        model: 'forecast_versions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    periodIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_index',
      comment: 'Period number (e.g. week 1, week 2, etc.)'
    },
    periodLabel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'period_label',
      comment: 'Human-readable period label (e.g. "KW 42", "Nov 2024")'
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Forecasted quantity for this product in this period'
    }
  }, {
    tableName: 'forecast_items',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['version_id'], name: 'idx_forecast_items_version_id' },
      { fields: ['product_id'], name: 'idx_forecast_items_product_id' },
      { unique: true, fields: ['version_id', 'product_id', 'period_index'], name: 'unique_forecast_item_per_period' }
    ]
  });

  ForecastItem.associate = (models) => {
    if (models.ForecastVersion) {
      ForecastItem.belongsTo(models.ForecastVersion, {
        foreignKey: 'versionId',
        as: 'version'
      });
    }

    if (models.Product) {
      ForecastItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  };

  // ===============================
  // 🔹 Class Methods
  // ===============================
  ForecastItem.getForecastByVersion = async function(versionId) {
    return await ForecastItem.findAll({
      where: { versionId },
      include: [
        {
          model: sequelize.models.Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'unit']
        }
      ],
      order: [['periodIndex', 'ASC'], ['product.name', 'ASC']]
    });
  };

  ForecastItem.getForecastByProduct = async function(productId, versionId = null) {
    const where = { productId };
    if (versionId) where.versionId = versionId;

    return await ForecastItem.findAll({
      where,
      include: [
        {
          model: sequelize.models.ForecastVersion,
          as: 'version',
          attributes: ['id', 'name', 'startDate', 'endDate', 'status']
        }
      ],
      order: [['periodIndex', 'ASC']]
    });
  };

  return ForecastItem;
};
