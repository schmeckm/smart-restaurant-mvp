// backend/src/models/ForecastItem.js
// Forecast Item Model - Individual forecast entries per product per period

module.exports = (sequelize, DataTypes) => {
  const ForecastItem = sequelize.define(
    'ForecastItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      versionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'version_id',
        references: {
          model: 'forecast_versions',
          key: 'id',
        },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
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
    },
    {
      tableName: 'forecast_items',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['version_id'] },
        { fields: ['product_id'] },
        { fields: ['version_id', 'product_id', 'period_index'], unique: true }
      ]
    }
  );

  ForecastItem.associate = (models) => {
    ForecastItem.belongsTo(models.ForecastVersion, {
      foreignKey: 'versionId',
      as: 'version',
    });

    ForecastItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
  };

  return ForecastItem;
};