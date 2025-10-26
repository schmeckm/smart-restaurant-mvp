// backend/src/models/index.js
// FIXED: Comprehensive model loader with consistent UUID architecture

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

console.log('🔄 Loading models with UUID architecture...');

const models = {};

// ==========================================
// MODEL LOADING STRATEGY
// ==========================================

const modelFiles = [
  'User',
  'Category',
  'Product',
  'Ingredient',
  'ProductIngredient',
  'Nutrition',
  'Sale',
  'ForecastVersion',
  'ForecastItem'
];

// Load all models
modelFiles.forEach(modelName => {
  try {
    const modelDefiner = require(`./${modelName}`);
    
    if (typeof modelDefiner === 'function') {
      models[modelName] = modelDefiner(sequelize);
      console.log(`✅ ${modelName} model loaded`);
    } else if (modelDefiner && typeof modelDefiner.findAll === 'function') {
      // Already instantiated model
      models[modelName] = modelDefiner;
      console.log(`✅ ${modelName} model loaded (pre-instantiated)`);
    } else {
      console.log(`⚠️  ${modelName} is not a valid model`);
    }
  } catch (err) {
    console.log(`❌ ${modelName} model failed:`, err.message);
  }
});

// ==========================================
// ASSOCIATIONS
// ==========================================

console.log('\n🔗 Configuring associations...');

// User Associations
if (models.User) {
  if (models.Sale) {
    models.User.hasMany(models.Sale, {
      foreignKey: 'userId',
      as: 'sales'
    });
  }
  if (models.ForecastVersion) {
    models.User.hasMany(models.ForecastVersion, {
      foreignKey: 'createdBy',
      as: 'forecastVersions'
    });
  }
  console.log('✅ User associations configured');
}

// Category Associations
if (models.Category && models.Product) {
  models.Category.hasMany(models.Product, {
    foreignKey: 'categoryId',
    as: 'products'
  });
  console.log('✅ Category associations configured');
}

// Product Associations
if (models.Product) {
  // Product → Category
  if (models.Category) {
    models.Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
  }

  // Product ↔ Ingredient (Many-to-Many)
  if (models.Ingredient && models.ProductIngredient) {
    models.Product.belongsToMany(models.Ingredient, {
      through: models.ProductIngredient,
      foreignKey: 'productId',
      as: 'ingredients'
    });
  }

  // Product → Sale
  if (models.Sale) {
    models.Product.hasMany(models.Sale, {
      foreignKey: 'productId',
      as: 'sales'
    });
  }

  // Product → ForecastItem
  if (models.ForecastItem) {
    models.Product.hasMany(models.ForecastItem, {
      foreignKey: 'productId',
      as: 'forecastItems'
    });
  }

  // Product → Nutrition (polymorphic)
  if (models.Nutrition) {
    models.Product.hasOne(models.Nutrition, {
      foreignKey: 'entityId',
      constraints: false,
      scope: { entityType: 'product' },
      as: 'nutrition'
    });
  }

  console.log('✅ Product associations configured');
}

// Ingredient Associations
if (models.Ingredient) {
  // Ingredient ↔ Product (Many-to-Many)
  if (models.Product && models.ProductIngredient) {
    models.Ingredient.belongsToMany(models.Product, {
      through: models.ProductIngredient,
      foreignKey: 'ingredientId',
      as: 'products'
    });
  }

  // Ingredient → Nutrition (polymorphic)
  if (models.Nutrition) {
    models.Ingredient.hasOne(models.Nutrition, {
      foreignKey: 'entityId',
      constraints: false,
      scope: { entityType: 'ingredient' },
      as: 'nutrition'
    });
  }

  console.log('✅ Ingredient associations configured');
}

// ProductIngredient Associations (Junction Table)
if (models.ProductIngredient) {
  if (models.Product) {
    models.ProductIngredient.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  }

  if (models.Ingredient) {
    models.ProductIngredient.belongsTo(models.Ingredient, {
      foreignKey: 'ingredientId',
      as: 'ingredient'
    });
  }

  console.log('✅ ProductIngredient associations configured');
}

// Sale Associations
if (models.Sale) {
  if (models.Product) {
    models.Sale.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  }

  if (models.User) {
    models.Sale.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  console.log('✅ Sale associations configured');
}

// ForecastVersion Associations
if (models.ForecastVersion) {
  if (models.User) {
    models.ForecastVersion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  }

  if (models.ForecastItem) {
    models.ForecastVersion.hasMany(models.ForecastItem, {
      foreignKey: 'versionId',
      as: 'items'
    });
  }

  console.log('✅ ForecastVersion associations configured');
}

// ForecastItem Associations
if (models.ForecastItem) {
  if (models.ForecastVersion) {
    models.ForecastItem.belongsTo(models.ForecastVersion, {
      foreignKey: 'versionId',
      as: 'version'
    });
  }

  if (models.Product) {
    models.ForecastItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  }

  console.log('✅ ForecastItem associations configured');
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  sequelize,
  Sequelize,
  ...models
};

console.log('\n🚀 Models loaded:', Object.keys(models).join(', '));
console.log('✅ All associations configured!\n');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Sync database (use with caution in production!)
module.exports.syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
};

// Test database connection
module.exports.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    return false;
  }
};

// Get all model names
module.exports.getModelNames = () => {
  return Object.keys(models);
};

// Validate all associations
module.exports.validateAssociations = () => {
  const errors = [];
  
  Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    const associations = model.associations;
    
    if (associations) {
      Object.keys(associations).forEach(assocName => {
        const assoc = associations[assocName];
        
        // Check if target model exists
        if (!models[assoc.target.name]) {
          errors.push(`${modelName}.${assocName} references non-existent model: ${assoc.target.name}`);
        }
      });
    }
  });

  if (errors.length > 0) {
    console.error('❌ Association validation errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }

  console.log('✅ All associations are valid');
  return true;
};