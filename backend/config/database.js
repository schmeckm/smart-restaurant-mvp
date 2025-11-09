// config/database.js - KORRIGIERTE VERSION
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || "restaurant_admin",
    password: process.env.DB_PASSWORD || "admin123",
    database: process.env.DB_NAME || "smart_restaurant_dev",  // 🔧 Konsistenter Name
    host: process.env.DB_HOST || "136.244.90.128",
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: { 
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {                             // 🔧 Pool-Konfiguration hinzugefügt
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log,               // Development: Volles Logging
    define: {
      underscored: true,                // 🔧 snake_case für DB
      freezeTableName: true,
      timestamps: true
    }
  },

  test: {
    username: process.env.TEST_DB_USER || "restaurant_admin",
    password: process.env.TEST_DB_PASSWORD || "admin123", 
    database: process.env.TEST_DB_NAME || "smart_restaurant_test",  // 🔧 Test DB
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: { ssl: false },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false,                     // Test: Kein Logging
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    }
  },

  production: {
    username: process.env.DB_USER,      // 🔧 MUSS gesetzt sein
    password: process.env.DB_PASSWORD,  // 🔧 MUSS gesetzt sein
    database: process.env.DB_NAME,      // 🔧 MUSS gesetzt sein
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {                            // 🔧 SSL für Production
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {                             // 🔧 Production Pool
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    logging: false,                     // Production: Kein SQL-Logging
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true
    }
  }
};