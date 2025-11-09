// backend/src/models/ForecastVersion.js
// CORRECTED - Forecast Version Model ohne SQL Syntax-Fehler

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForecastVersion = sequelize.define('ForecastVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date'
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
      field: 'period_count',
      validate: { min: 1, max: 52 }
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
      // 🔥 REMOVED: comment field - this was causing the SQL syntax error
    },
    isBaseline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_baseline'
    }
  }, {
    tableName: 'forecast_versions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['restaurant_id'], name: 'idx_forecast_versions_restaurant_id' },
      { fields: ['created_by'], name: 'idx_forecast_versions_created_by' },
      { fields: ['start_date', 'end_date'], name: 'idx_forecast_versions_date_range' },
      { unique: true, fields: ['restaurant_id', 'name'], name: 'unique_forecast_version_name' }
    ]
  });

  // ===============================
  // 🔗 Associations
  // ===============================
  ForecastVersion.associate = (models) => {
    if (models.Restaurant) {
      ForecastVersion.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }

    if (models.User) {
      ForecastVersion.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }

    if (models.ForecastItem) {
      ForecastVersion.hasMany(models.ForecastItem, {
        foreignKey: 'versionId',
        as: 'items',
        onDelete: 'CASCADE'
      });
    }
  };

  // ===============================
  // 🔹 Hooks
  // ===============================
  ForecastVersion.beforeCreate(async (version) => {
    // Ensure only one baseline per restaurant
    if (version.isBaseline) {
      await ForecastVersion.update(
        { isBaseline: false },
        { 
          where: { 
            restaurantId: version.restaurantId,
            isBaseline: true 
          } 
        }
      );
    }
  });

  ForecastVersion.beforeUpdate(async (version) => {
    // Ensure only one baseline per restaurant
    if (version.changed('isBaseline') && version.isBaseline) {
      await ForecastVersion.update(
        { isBaseline: false },
        { 
          where: { 
            restaurantId: version.restaurantId,
            id: { [sequelize.Sequelize.Op.ne]: version.id },
            isBaseline: true 
          } 
        }
      );
    }
  });

  // ===============================
  // 🔹 Class Methods
  // ===============================
  ForecastVersion.getBaseline = async function(restaurantId) {
    return await ForecastVersion.findOne({
      where: { 
        restaurantId, 
        isBaseline: true 
      },
      include: [
        {
          model: sequelize.models.ForecastItem,
          as: 'items',
          include: [
            {
              model: sequelize.models.Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });
  };

  ForecastVersion.getVersionsByPeriod = async function(restaurantId, startDate, endDate) {
    return await ForecastVersion.findAll({
      where: {
        restaurantId,
        [sequelize.Sequelize.Op.or]: [
          {
            startDate: {
              [sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          }
        ]
      },
      order: [['startDate', 'ASC']]
    });
  };

  return ForecastVersion;
};