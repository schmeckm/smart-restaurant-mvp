// config/pgPool.js - NATIVE PG POOL für consistency
// Löst das Problem mit verschiedenen Pool-Imports

require('dotenv').config();
const { Pool } = require('pg');

// 🔧 Einheitliche Pool-Konfiguration für alle availability routes
const pool = new Pool({
  host: process.env.DB_HOST || '136.244.90.128',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_restaurant_dev',
  user: process.env.DB_USER || 'restaurant_admin', 
  password: process.env.DB_PASSWORD || 'admin123',
  
  // Pool-Konfiguration
  max: 20,                    // Maximum Verbindungen
  min: 5,                     // Minimum Verbindungen
  idleTimeoutMillis: 30000,   // 30 Sekunden idle timeout
  connectionTimeoutMillis: 2000, // 2 Sekunden connection timeout
  
  // SSL-Konfiguration
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false,
  
  // Statement timeout
  statement_timeout: 30000,   // 30 Sekunden
  query_timeout: 30000
});

// Event-Handler für Pool-Events
pool.on('connect', (client) => {
  console.log('🔌 New database connection established');
});

pool.on('error', (err, client) => {
  console.error('❌ Database pool error:', err);
});

pool.on('remove', (client) => {
  console.log('🔌 Database connection removed');
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down database pool...');
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Test-Funktion für Verbindung
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection test successful:', {
      time: result.rows[0].current_time,
      version: result.rows[0].postgres_version.split(' ')[0]
    });
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

// Export pool und test-Funktion
module.exports = {
  pool,
  testConnection,
  gracefulShutdown
};

// Für backward compatibility
module.exports.default = pool;