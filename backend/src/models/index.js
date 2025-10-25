// backend/src/models/index.js
// FIXED: Arbeitet mit den existierenden Model-Patterns

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

console.log('🔄 Loading models...');

const models = {};

// ==========================================
// LOAD DIRECT-EXPORT MODELS (bereits initialisiert)
// ==========================================

// Diese Models sind bereits mit sequelize.define() erstellt
// und müssen NICHT nochmal initialisiert werden
const directExportModels = [
  'User',
  'Product', 
  'Sale',
  'Ingredient',
  'Category',
  'RecipeIngredient'
];

directExportModels.forEach(modelName => {
  try {
    const model = require(`./${modelName}`);
    
    // Prüfe ob es ein gültiges Sequelize Model ist
    if (model && model.name && typeof model.findAll === 'function') {
      models[modelName] = model;
      console.log(`✅ ${modelName} model loaded (direct export)`);
    } else {
      console.log(`⚠️  ${modelName} is not a valid Sequelize model`);
    }
  } catch (err) {
    console.log(`❌ ${modelName} model failed:`, err.message);
  }
});

// ==========================================
// LOAD FUNCTION-PATTERN MODELS (müssen initialisiert werden)
// ==========================================

// Diese Models exportieren eine Function die sequelize erwartet
const functionPatternModels = [
  'ForecastVersion',
  'ForecastItem'
];

functionPatternModels.forEach(modelName => {
  try {
    const modelDefiner = require(`./${modelName}`);
    
    if (typeof modelDefiner === 'function') {
      models[modelName] = modelDefiner(sequelize);
      console.log(`✅ ${modelName} model loaded (function pattern)`);
    } else {
      console.log(`⚠️  ${modelName} is not a function pattern model`);
    }
  } catch (err) {
    console.log(`❌ ${modelName} model failed:`, err.message);
  }
});

// ==========================================
// SKIP RECIPE.JS (ist eine Route-Datei, kein Model!)
// ==========================================
console.log('⚠️  Recipe.js skipped (is a route file, not a model)');

// ==========================================
// DEFINE ASSOCIATIONS
// ==========================================

// Product ↔ Category
if (models.Product && models.Category) {
  try {
    models.Product.belongsTo(models.Category, { 
      foreignKey: 'categoryId', 
      as: 'categoryRelation'  // Alias geändert wegen conflict mit 'category' field
    });
    models.Category.hasMany(models.Product, { 
      foreignKey: 'categoryId', 
      as: 'products' 
    });
    console.log('✅ Product-Category associations configured');
  } catch (err) {
    console.log('⚠️  Product-Category associations skipped:', err.message);
  }
}

// User ↔ Sale
if (models.User && models.Sale) {
  try {
    models.User.hasMany(models.Sale, { 
      foreignKey: 'user_id',  // Use snake_case wie in Sale Model
      as: 'sales' 
    });
    models.Sale.belongsTo(models.User, { 
      foreignKey: 'user_id',  // Use snake_case wie in Sale Model
      as: 'user' 
    });
    console.log('✅ User-Sale associations configured');
  } catch (err) {
    console.log('⚠️  User-Sale associations skipped:', err.message);
  }
}

// Product ↔ Sale
if (models.Product && models.Sale) {
  try {
    models.Product.hasMany(models.Sale, { 
      foreignKey: 'product_id',  // Use snake_case wie in Sale Model
      as: 'sales' 
    });
    models.Sale.belongsTo(models.Product, { 
      foreignKey: 'product_id',  // Use snake_case wie in Sale Model
      as: 'product' 
    });
    console.log('✅ Product-Sale associations configured');
  } catch (err) {
    console.log('⚠️  Product-Sale associations skipped:', err.message);
  }
}

// ForecastVersion ↔ ForecastItem
if (models.ForecastVersion && models.ForecastItem) {
  try {
    models.ForecastVersion.hasMany(models.ForecastItem, {
      foreignKey: 'versionId',
      as: 'items'
    });
    models.ForecastItem.belongsTo(models.ForecastVersion, {
      foreignKey: 'versionId',
      as: 'version'
    });
    console.log('✅ ForecastVersion-ForecastItem associations configured');
  } catch (err) {
    console.log('⚠️  ForecastVersion-ForecastItem associations skipped:', err.message);
  }
}

// ForecastItem ↔ Product
if (models.ForecastItem && models.Product) {
  try {
    models.ForecastItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    models.Product.hasMany(models.ForecastItem, {
      foreignKey: 'productId',
      as: 'forecastItems'
    });
    console.log('✅ ForecastItem-Product associations configured');
  } catch (err) {
    console.log('⚠️  ForecastItem-Product associations skipped:', err.message);
  }
}

// ForecastVersion ↔ User (createdBy)
if (models.ForecastVersion && models.User) {
  try {
    models.ForecastVersion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    models.User.hasMany(models.ForecastVersion, {
      foreignKey: 'createdBy',
      as: 'forecastVersions'
    });
    console.log('✅ ForecastVersion-User associations configured');
  } catch (err) {
    console.log('⚠️  ForecastVersion-User associations skipped:', err.message);
  }
}

// ==========================================
// RECIPE ASSOCIATIONS (wenn Recipe Model existiert)
// ==========================================
// Aktuell ist Recipe.js eine Route-Datei
// Wenn ein echtes Recipe Model erstellt wird, hier aktivieren:

/*
if (models.Recipe && models.Product) {
  models.Product.hasMany(models.Recipe, { as: 'recipes', foreignKey: 'productId' });
  models.Recipe.belongsTo(models.Product, { as: 'product', foreignKey: 'productId' });
  console.log('✅ Product-Recipe associations configured');
}

if (models.Recipe && models.Ingredient && models.RecipeIngredient) {
  models.Recipe.belongsToMany(models.Ingredient, {
    through: models.RecipeIngredient,
    as: 'ingredients',
    foreignKey: 'recipeId'
  });
  models.Ingredient.belongsToMany(models.Recipe, {
    through: models.RecipeIngredient,
    as: 'recipes',
    foreignKey: 'ingredientId'
  });
  console.log('✅ Recipe-Ingredient associations configured');
}
*/

// ==========================================
// EXPORT MODELS + SEQUELIZE
// ==========================================
module.exports = {
  sequelize,
  Sequelize,
  ...models
};

console.log('🚀 Models loaded:', Object.keys(models).join(', '));
console.log('✅ Model loading complete!\n');