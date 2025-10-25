// ============================================
// backend/server.js - OPTIMIZED VERSION
// ============================================
require('dotenv').config();

// 🔧 FIX: MaxListenersExceededWarning
require('events').EventEmitter.defaultMaxListeners = 20;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const db = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// 🔧 Disable ETag caching (verhindert 304 Responses)
app.set('etag', false);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// 🔍 DEBUG MIDDLEWARE - Nur wenn DEBUG_MODE=true
if (process.env.DEBUG_MODE === 'true') {
  app.use((req, res, next) => {
    console.log('\n🔍 ========== REQUEST DEBUG ==========');
    console.log('📍 Method:', req.method);
    console.log('📍 URL:', req.url);
    console.log('📍 Authorization:', req.headers.authorization ? '✅ Present' : '❌ Missing');
    console.log('📍 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 ===================================\n');
    next();
  });
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: db.connectionManager.pool ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error Handler
app.use(errorHandler);

// Start Server
let server; // 🔧 Server-Referenz für Graceful Shutdown

const startServer = async () => {
  try {
    // Database Connection
    await db.authenticate();
    logger.info('✅ Database connected');
    
    // Sync Database (nur in Development)
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
      logger.info('✅ Database synced');
    }

    // Start HTTP Server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.DEBUG_MODE === 'true') {
        console.log('\n🔍 DEBUG MODE ACTIVE - Showing all request headers\n');
      }
      
      console.log('\n✅ Server ready to accept connections\n');
    });

    // Server Error Handler
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Server start failed:', error);
    process.exit(1);
  }
};

// 🔧 Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received - Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing server:', err);
            reject(err);
          } else {
            logger.info('✅ HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Close database connection
    await db.close();
    logger.info('✅ Database connection closed');
    
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// 🔧 Process Signal Handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // Ctrl+C

// 🔧 Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: Shutdown bei kritischen Errors
  if (process.env.EXIT_ON_UNHANDLED_REJECTION === 'true') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// 🔧 Uncaught Exception Handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer();

module.exports = app;