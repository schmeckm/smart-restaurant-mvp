// ============================================
// backend/server.js
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');        // ✅ NEU
const swaggerJsdoc = require('swagger-jsdoc');          // ✅ NEU

const db = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 🛡️ Security & Middleware
// ============================================
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

// ============================================
// 🪵 Logging
// ============================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================
// 🔍 Debug Middleware (optional)
// ============================================
app.use((req, res, next) => {
  console.log('\n🔍 ========== REQUEST DEBUG ==========');
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📍 Authorization Header:', req.headers.authorization || '❌ NONE');
  next();
});

// ============================================
// 💚 Health Check
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// 📘 Swagger Setup  ✅ NEU
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
        bearerAuth: {                     // ✅ Wichtig: Token-Definition
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Gib hier deinen JWT-Token ein (ohne "Bearer" Präfix)'
        }
      }
    },
    security: [                           // ✅ aktiviert global für alle Routen
      { bearerAuth: [] }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']  // 🔍 hier sucht Swagger nach Doku-Kommentaren
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
console.log('📚 Swagger UI verfügbar unter: http://localhost:' + PORT + '/api-docs');

// ============================================
// 📦 API Routes
// ============================================
app.use('/api/v1', routes);

// ============================================
// ❌ 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============================================
// ⚠️ Error Handler
// ============================================
app.use(errorHandler);

// ============================================
// 🚀 Server Start
// ============================================
const startServer = async () => {
  try {
    await db.authenticate();
    logger.info('✅ Database connected');
    
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: false });
      logger.info('✅ Database synced');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log('✅ Swagger UI: http://localhost:' + PORT + '/api-docs');
    });
  } catch (error) {
    logger.error('❌ Server start failed:', error);
    process.exit(1);
  }
};

// ============================================
// 🧹 Graceful Shutdown
// ============================================
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await db.close();
  process.exit(0);
});

startServer();

module.exports = app;
