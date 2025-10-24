// backend/src/models/index.js
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// ==========================================
// LOAD ALL MODELS
// ==========================================
console.log('🔄 Loading models...');

const models = {};

try {
  models.User = require('./User');
  console.log('✅ User model loaded');
} catch (err) {
  console.log('❌ User model failed:', err.message);
}

try {
  models.Product = require('./Product');
  console.log('✅ Product model loaded');
} catch (err) {
  console.log('❌ Product model failed:', err.message);
}

try {
  models.Sale = require('./Sale');
  console.log('✅ Sale model loaded');
} catch (err) {
  console.log('❌ Sale model failed:', err.message);
}

try {
  models.Ingredient = require('./Ingredient');
  console.log('✅ Ingredient model loaded');
} catch (err) {
  console.log('❌ Ingredient model failed:', err.message);
}

try {
  models.Category = require('./Category');
  console.log('✅ Category model loaded');
} catch (err) {
  console.log('❌ Category model failed:', err.message);
}

try {
  models.Recipe = require('./Recipe');
  console.log('✅ Recipe model loaded');
} catch (err) {
  console.log('❌ Recipe model failed:', err.message);
}

try {
  models.RecipeIngredient = require('./RecipeIngredient');
  console.log('✅ RecipeIngredient model loaded');
} catch (err) {
  console.log('❌ RecipeIngredient model failed:', err.message);
}

// ==========================================
// INITIALIZE MODELS (pass sequelize + DataTypes)
// ==========================================
Object.keys(models).forEach(name => {
  const model = models[name];
  if (typeof model === 'function') {
    models[name] = model(sequelize, Sequelize.DataTypes);
  }
});

// ==========================================
// DEFINE ASSOCIATIONS
// ==========================================

// Product ↔ Category
if (models.Product && models.Category) {
  models.Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  models.Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
  console.log('✅ Product-Category associations configured');
}

// User ↔ Sale
if (models.User && models.Sale) {
  models.User.hasMany(models.Sale, { foreignKey: 'userId', as: 'sales' });
  models.Sale.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  console.log('✅ User-Sale associations configured');
}

// Product ↔ Sale
if (models.Product && models.Sale) {
  models.Product.hasMany(models.Sale, { foreignKey: 'productId', as: 'sales' });
  models.Sale.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  console.log('✅ Product-Sale associations configured');
}

// Recipe ↔ Product
if (models.Recipe && models.Product) {
  models.Product.hasMany(models.Recipe, { as: 'recipes', foreignKey: 'productId' });
  models.Recipe.belongsTo(models.Product, { as: 'product', foreignKey: 'productId' });
  console.log('✅ Product-Recipe associations configured');
}

// Recipe ↔ Ingredient (many-to-many)
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

// ==========================================
// EXPORT MODELS + SEQUELIZE
// ==========================================
module.exports = {
  sequelize,
  Sequelize,
  ...models
};

console.log('🚀 All models loaded and exported:', Object.keys(models));
