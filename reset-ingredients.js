require('dotenv').config();
const { sequelize } = require('../models');

const resetIngredientsTable = async () => {
  try {
    console.log('🗑️  Dropping ingredients table...');
    
    await sequelize.query('DROP TABLE IF EXISTS ingredients CASCADE');
    
    console.log('✅ Ingredients table dropped!');
    console.log('⚠️  Please restart the server to recreate the table.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetIngredientsTable();