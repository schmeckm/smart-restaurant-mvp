require('dotenv').config();
const { sequelize } = require('../models');

const resetAllTables = async () => {
  try {
    console.log('🗑️  Dropping all tables...');
    
    await sequelize.query('DROP TABLE IF EXISTS recipes CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS ingredients CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS sales CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS products CASCADE');
    
    // Users Table NICHT löschen damit Login funktioniert!
    // await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Tables dropped!');
    console.log('⚠️  Please restart the server to recreate tables.');
    console.log('💡 Users table was kept to preserve login data.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAllTables();