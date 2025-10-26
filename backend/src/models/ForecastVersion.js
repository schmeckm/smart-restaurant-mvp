// backend/src/models/ForecastVersion.js
// Forecast Version Model

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForecastVersion = sequelize.define('ForecastVersion', {
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
    timeUnit: {
      type: DataTypes.ENUM('days', 'weeks', 'months', 'quarters'),
      defaultValue: 'weeks',
      field: 'time_unit'
    },
    periodCount: {
      type: DataTypes.INTEGER,
      defaultValue: 8,
      field: 'period_count'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      defaultValue: 'draft'
    },
    isBaseline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_baseline'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'forecast_versions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['is_baseline'] },
      { fields: ['created_by'] },
      { fields: ['start_date'] }
    ]
  });

  // Associations
  ForecastVersion.associate = (models) => {
    // Belongs to User (creator)
    ForecastVersion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Has many ForecastItems
    ForecastVersion.hasMany(models.ForecastItem, {
      foreignKey: 'versionId',
      as: 'items',
      onDelete: 'CASCADE'
    });
  };

  return ForecastVersion;
};