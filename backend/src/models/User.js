// backend/src/models/User.js
// Fixed User Model with proper Sequelize import

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'google_id'
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Can be null for Google OAuth users
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'employee'),
      defaultValue: 'employee'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  // Associations will be added in index.js
  User.associate = (models) => {
    if (models.Sale) {
      User.hasMany(models.Sale, {
        foreignKey: 'userId',
        as: 'sales'
      });
    }
    
    if (models.ForecastVersion) {
      User.hasMany(models.ForecastVersion, {
        foreignKey: 'createdBy',
        as: 'forecastVersions'
      });
    }
  };

  return User;
};