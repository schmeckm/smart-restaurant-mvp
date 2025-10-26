// backend/src/config/database.js
// Fixed database config - reads from .env correctly

require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('📊 Database Config:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Port: ${process.env.DB_PORT}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   Password: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}\n`);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'admin',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || '136.244.90.128',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err.message);
  });

module.exports = sequelize;