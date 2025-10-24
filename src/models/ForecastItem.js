const { DataTypes } = require('sequelize');

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
      field: 'version_id'
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id'
    },
    periodIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_index'
    },
    periodLabel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'period_label'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'forecast_items',
    timestamps: true,
    underscored: true
  });

  return ForecastItem;
};