// backend/src/models/Category.js
// Fixed Category Model with proper Sequelize import + Multi-Tenant Support

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
      // unique: true <- ENTFERNT! Jetzt unique pro Restaurant via Index
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // ========== NEU: Multi-Tenant Support ==========
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
    // ===============================================
    color: {
      type: DataTypes.STRING(7), // Hex color #RRGGBB
      defaultValue: '#409EFF'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    // ========== NEU: Indexes für Performance & Unique per Restaurant ==========
    indexes: [
      {
        unique: true,
        fields: ['name', 'restaurant_id'],  // Name ist unique PRO Restaurant
        name: 'unique_category_name_per_restaurant'
      },
      { 
        fields: ['restaurant_id'],
        name: 'idx_categories_restaurant_id'
      },
      { 
        fields: ['is_active'],
        name: 'idx_categories_is_active'
      },
      { 
        fields: ['sort_order'],
        name: 'idx_categories_sort_order'
      }
    ]
    // ==========================================================================
  });

  Category.associate = (models) => {
    // ========== NEU: Belongs to Restaurant ==========
    if (models.Restaurant) {
      Category.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    }
    // ================================================
    
    if (models.Product) {
      Category.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'products'
      });
    }
  };

  return Category;
};