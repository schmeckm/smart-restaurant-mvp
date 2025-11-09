// backend/src/models/User.js
const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Benutzer des Restaurant Systems
 *       required:
 *         - email
 *         - password
 *         - name
 *         - restaurantId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *         email:
 *           type: string
 *           example: "admin@restaurant.com"
 *         name:
 *           type: string
 *           example: "Max Mustermann"
 *         role:
 *           type: string
 *           enum: [admin, manager, staff]
 *           example: "admin"
 *         uiLanguage:
 *           type: string
 *           example: "de"
 *         isActive:
 *           type: boolean
 *           example: true
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           example: "c4a9a456-bef4-4a22-a513-9229f8a7e0dd"
 */

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
  type: DataTypes.STRING,
  allowNull: true,
  validate: {
    len: [5, 30]
  }
},
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'staff'),
      defaultValue: 'staff'
    },
    uiLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'de',
      field: 'ui_language'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'idx_user_email'
      },
      {
        fields: ['restaurant_id'],
        name: 'idx_user_restaurant'
      },
      {
        fields: ['role'],
        name: 'idx_user_role'
      }
    ]
  });

  // ===============================
  // 🔗 Associations
  // ===============================
  User.associate = (models) => {
    if (models.Restaurant) {
      User.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }
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

  // ===============================
  // 🔹 Class Methods
  // ===============================
  User.findByEmail = async function(email) {
    return await User.findOne({ 
      where: { email },
      include: [
        {
          model: sequelize.models.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'isActive']
        }
      ]
    });
  };

  User.getActiveUsers = async function(restaurantId = null) {
    const where = { isActive: true };
    if (restaurantId) where.restaurantId = restaurantId;
    return await User.findAll({ 
      where,
      order: [['name', 'ASC']],
      include: [
        {
          model: sequelize.models.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
  };

  // ===============================
  // 🔹 Instance Methods
  // ===============================
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  // ===============================
  // 🔹 Hooks
  // ===============================
  User.beforeCreate(async (user) => {
    console.log(`🔔 Neuer User wird erstellt: ${user.email}`);
  });

  User.beforeDestroy(async (user) => {
    console.log(`🔔 User ${user.email} wird gelöscht`);
  });

  return User;
};