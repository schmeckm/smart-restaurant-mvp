// ============================================
// backend/server.js - FINAL VERSION (lokal + iotshowroom.de)
// ============================================

require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 20;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const db = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 🛡️ Security & Middleware
// ============================================

// 💡 Erlaubte Frontend-Quellen
const allowedOrigins = [
  'http://localhost:8080',       // Vue Dev Server
  'http://localhost:5173',       // (optional) Vite Dev Server
  'https://iotshowroom.de',      // Produktionsfrontend
  'https://www.iotshowroom.de'   // Subdomain
];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        console.warn('🚫 CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

app.disable('etag');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ============================================
// 🪵 Logging
// ============================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================
// 🩺 Health Check + Testroute
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: db.connectionManager?.pool ? 'connected' : 'disconnected'
  });
});

// 🔍 Testroute für API-Verbindung
app.get('/api/v1/ping', (req, res) => {
  res.status(200).json({
    message: 'pong 🏓',
    frontend: process.env.FRONTEND_URL || 'not set',
    api_url: `http://localhost:${PORT}/api/v1`,
    time: new Date().toISOString()
  });
});

// ============================================
// 📘 Swagger Setup
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Restaurant API',
      version: '1.0.0',
      description: 'API Dokumentation für das Smart Restaurant Backend'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token eingeben (ohne "Bearer")'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
console.log(`📚 Swagger UI verfügbar unter: http://localhost:${PORT}/api-docs`);

// ============================================
// 📦 API Routes
// ============================================
app.use('/api/v1', routes);

// ============================================
// ⚠️ 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// ============================================
// ❌ Error Handler
// ============================================
app.use(errorHandler);

// ============================================
// 🚀 Server Start
// ============================================
let server;

const startServer = async () => {
  try {
    await db.authenticate();
    logger.info('✅ Database connected');

    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
      logger.info('✅ Database synced');
    }

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ API Docs: http://localhost:${PORT}/api-docs\n`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} already in use`);
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

// ============================================
// 🧹 Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received - graceful shutdown...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    await db.close();
    logger.info('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ============================================
// 🚀 Start
// ============================================
startServer();

module.exports = app;
