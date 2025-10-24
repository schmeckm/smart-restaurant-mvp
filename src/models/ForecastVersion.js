// backend/src/models/ForecastVersion.js

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
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timeUnit: {
      type: DataTypes.ENUM('weeks', 'months', 'quarters'),
      allowNull: false,
      defaultValue: 'weeks',
      field: 'time_unit'
    },
    periodCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8,
      field: 'period_count'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    isBaseline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_baseline'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    }
  }, {
    tableName: 'forecast_versions',
    timestamps: true,
    underscored: true
  });

  return ForecastVersion;
};