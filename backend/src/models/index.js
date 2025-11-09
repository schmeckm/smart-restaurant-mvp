// backend/src/models/index.js
// CORRECTED - Mit Employee Model, Shift Models temporär deaktiviert

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

console.log('🔄 Loading models...');

const models = {};

// Load models manually
try {
  models.Restaurant = require('./Restaurant')(sequelize);
  console.log('✅ Restaurant model loaded');
} catch (err) {
  console.log('❌ Restaurant model failed:', err.message);
}

try {
  models.User = require('./User')(sequelize);
  console.log('✅ User model loaded');
} catch (err) {
  console.log('❌ User model failed:', err.message);
}

try {
  models.Category = require('./Category')(sequelize);
  console.log('✅ Category model loaded');
} catch (err) {
  console.log('❌ Category model failed:', err.message);
}

try {
  models.Product = require('./Product')(sequelize);
  console.log('✅ Product model loaded');
} catch (err) {
  console.log('❌ Product model failed:', err.message);
}

try {
  models.Ingredient = require('./Ingredient')(sequelize);
  console.log('✅ Ingredient model loaded');
} catch (err) {
  console.log('❌ Ingredient model failed:', err.message);
}

try {
  models.ProductIngredient = require('./ProductIngredient')(sequelize);
  console.log('✅ ProductIngredient model loaded');
} catch (err) {
  console.log('❌ ProductIngredient model failed:', err.message);
}

try {
  models.Nutrition = require('./Nutrition')(sequelize);
  console.log('✅ Nutrition model loaded');
} catch (err) {
  console.log('❌ Nutrition model failed:', err.message);
}

try {
  models.Sale = require('./Sale')(sequelize);
  console.log('✅ Sale model loaded');
} catch (err) {
  console.log('❌ Sale model failed:', err.message);
}

try {
  models.ForecastVersion = require('./ForecastVersion')(sequelize);
  console.log('✅ ForecastVersion model loaded');
} catch (err) {
  console.log('❌ ForecastVersion model failed:', err.message);
}

try {
  models.ForecastItem = require('./ForecastItem')(sequelize);
  console.log('✅ ForecastItem model loaded');
} catch (err) {
  console.log('❌ ForecastItem model failed:', err.message);
}

// 👥 Employee Model
try {
  models.Employee = require('./Employee')(sequelize);
  console.log('✅ Employee model loaded');
} catch (err) {
  console.log('❌ Employee model failed:', err.message);
}

// 📋 Shift Model - TEMPORÄR DEAKTIVIERT
/*
try {
  models.Shift = require('./Shift')(sequelize);
  console.log('✅ Shift model loaded');
} catch (err) {
  console.log('❌ Shift model failed:', err.message);
}
*/

// 📊 ShiftPerformance Model - TEMPORÄR DEAKTIVIERT
/*
try {
  models.ShiftPerformance = require('./ShiftPerformance')(sequelize);
  console.log('✅ ShiftPerformance model loaded');
} catch (err) {
  console.log('❌ ShiftPerformance model failed:', err.message);
}
*/

// Setup associations
console.log('\n🔗 Setting up associations...');

// Restaurant associations
if (models.Restaurant) {
  if (models.User) {
    models.Restaurant.hasMany(models.User, { foreignKey: 'restaurantId', as: 'users' });
    models.User.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  if (models.Product) {
    models.Restaurant.hasMany(models.Product, { foreignKey: 'restaurantId', as: 'products' });
    models.Product.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  if (models.Category) {
    models.Restaurant.hasMany(models.Category, { foreignKey: 'restaurantId', as: 'categories' });
    models.Category.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  if (models.Ingredient) {
    models.Restaurant.hasMany(models.Ingredient, { foreignKey: 'restaurantId', as: 'ingredients' });
    models.Ingredient.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  if (models.Sale) {
    models.Restaurant.hasMany(models.Sale, { foreignKey: 'restaurantId', as: 'sales' });
    models.Sale.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  if (models.ForecastVersion) {
    models.Restaurant.hasMany(models.ForecastVersion, { foreignKey: 'restaurantId', as: 'forecastVersions' });
    models.ForecastVersion.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  // 👥 Restaurant ↔ Employee associations
  if (models.Employee) {
    models.Restaurant.hasMany(models.Employee, { foreignKey: 'restaurantId', as: 'employees' });
    models.Employee.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  // 📋 Restaurant ↔ Shift associations - TEMPORÄR DEAKTIVIERT
  /*
  if (models.Shift) {
    models.Restaurant.hasMany(models.Shift, { foreignKey: 'restaurantId', as: 'shifts' });
    models.Shift.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
  }
  */
  console.log('✅ Restaurant associations configured');
}

// Category ↔ Product associations
if (models.Category && models.Product) {
  models.Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
  models.Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  console.log('✅ Category ↔ Product associations configured');
}

// User ↔ Sale associations
if (models.User && models.Sale) {
  models.User.hasMany(models.Sale, { foreignKey: 'userId', as: 'sales' });
  models.Sale.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  console.log('✅ User ↔ Sale associations configured');
}

// Product ↔ Sale associations
if (models.Product && models.Sale) {
  models.Product.hasMany(models.Sale, { foreignKey: 'productId', as: 'sales' });
  models.Sale.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  console.log('✅ Product ↔ Sale associations configured');
}

// User ↔ ForecastVersion associations
if (models.User && models.ForecastVersion) {
  models.User.hasMany(models.ForecastVersion, { foreignKey: 'createdBy', as: 'forecastVersions' });
  models.ForecastVersion.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  console.log('✅ User ↔ ForecastVersion associations configured');
}

// ForecastVersion ↔ ForecastItem associations
if (models.ForecastVersion && models.ForecastItem) {
  models.ForecastVersion.hasMany(models.ForecastItem, { foreignKey: 'versionId', as: 'items', onDelete: 'CASCADE' });
  models.ForecastItem.belongsTo(models.ForecastVersion, { foreignKey: 'versionId', as: 'version' });
  console.log('✅ ForecastVersion ↔ ForecastItem associations configured');
}

// Product ↔ ForecastItem associations
if (models.Product && models.ForecastItem) {
  models.Product.hasMany(models.ForecastItem, { foreignKey: 'productId', as: 'forecastItems' });
  models.ForecastItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  console.log('✅ Product ↔ ForecastItem associations configured');
}

// 🔥 CRITICAL: Product ↔ ProductIngredient direct associations (MISSING!)
if (models.Product && models.ProductIngredient) {
  models.Product.hasMany(models.ProductIngredient, { foreignKey: 'productId', as: 'productIngredients' });
  models.ProductIngredient.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  console.log('✅ Product ↔ ProductIngredient associations configured');
}

// 🔥 CRITICAL: Ingredient ↔ ProductIngredient direct associations (MISSING!)
if (models.Ingredient && models.ProductIngredient) {
  models.Ingredient.hasMany(models.ProductIngredient, { foreignKey: 'ingredientId', as: 'productIngredients' });
  models.ProductIngredient.belongsTo(models.Ingredient, { foreignKey: 'ingredientId', as: 'ingredient' });
  console.log('✅ Ingredient ↔ ProductIngredient associations configured');
}

// Product ↔ Ingredient associations (Many-to-Many) - KEEP EXISTING
if (models.Product && models.Ingredient && models.ProductIngredient) {
  models.Product.belongsToMany(models.Ingredient, { 
    through: models.ProductIngredient, 
    foreignKey: 'productId', 
    as: 'ingredients' 
  });
  models.Ingredient.belongsToMany(models.Product, { 
    through: models.ProductIngredient, 
    foreignKey: 'ingredientId', 
    as: 'products' 
  });
  console.log('✅ Product ↔ Ingredient (Many-to-Many) associations configured');
}

// 👥 Employee ↔ Shift associations - TEMPORÄR DEAKTIVIERT
/*
if (models.Employee && models.Shift) {
  models.Employee.hasMany(models.Shift, { foreignKey: 'employeeId', as: 'shifts' });
  models.Shift.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  console.log('✅ Employee ↔ Shift associations configured');
}
*/

// 📊 Shift ↔ ShiftPerformance associations - TEMPORÄR DEAKTIVIERT
/*
if (models.Shift && models.ShiftPerformance) {
  models.Shift.hasOne(models.ShiftPerformance, { foreignKey: 'shiftId', as: 'performance' });
  models.ShiftPerformance.belongsTo(models.Shift, { foreignKey: 'shiftId', as: 'shift' });
  console.log('✅ Shift ↔ ShiftPerformance associations configured');
}
*/

console.log('✅ All associations configured\n');

module.exports = {
  sequelize,
  Sequelize,
  ...models
};