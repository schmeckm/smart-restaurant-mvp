require('dotenv').config();
const { sequelize } = require('../models');

const resetRecipesTable = async () => {
  try {
    console.log('🗑️  Dropping recipes table...');
    
    await sequelize.query('DROP TABLE IF EXISTS recipes CASCADE');
    
    console.log('✅ Recipes table dropped!');
    console.log('⚠️  Please restart the server to recreate the table.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetRecipesTable();