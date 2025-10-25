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
      quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      tableName: 'forecast_items',
      timestamps: true,
      underscored: true, // 🔹 wichtig für created_at / updated_at
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
