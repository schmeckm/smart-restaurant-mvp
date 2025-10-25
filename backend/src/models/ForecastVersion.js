module.exports = (sequelize, DataTypes) => {
  const ForecastVersion = sequelize.define(
    'ForecastVersion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'forecast_versions',
      timestamps: true,
      underscored: true, // 🔹 sorgt für created_at / updated_at statt createdAt / updatedAt
    }
  );

  ForecastVersion.associate = (models) => {
    ForecastVersion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'user',
    });

    ForecastVersion.hasMany(models.ForecastItem, {
      foreignKey: 'versionId',
      as: 'items',
    });
  };

  return ForecastVersion;
};
