// backend/src/scripts/createTables.js
const { sequelize } = require('../config/db');

// Import all models to register them
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const RecipeIngredient = require('../models/RecipeIngredient');

async function createTables() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Creating tables...');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false }); // force: false means don't drop existing tables
    
    console.log('✅ All tables created successfully!');
    
    // Show created tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
    process.exit();
  }
}

// Run the script
createTables();