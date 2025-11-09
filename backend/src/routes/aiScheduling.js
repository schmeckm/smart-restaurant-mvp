const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiSchedulingController = require('../controllers/aiSchedulingController');

/**
 * @swagger
 * tags:
 *   name: AI Scheduling
 *   description: KI-gestützte Nachfragevorhersage und Schichtplanung
 */

/**
 * @swagger
 * /api/v1/ai/forecast:
 *   get:
 *     summary: "🔮 KI-Nachfragevorhersage für ein Restaurant"
 *     tags: [AI Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeWeather
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Wetterdaten berücksichtigen
 *     responses:
 *       200:
 *         description: Erfolgreiche Vorhersage
 *       500:
 *         description: Interner Serverfehler
 */

/**
 * @swagger
 * /api/v1/ai/schedule:
 *   post:
 *     summary: "📅 KI-Schichtplan generieren"
 *     tags: [AI Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               week:
 *                 type: string
 *                 example: "2025-W44"
 *               preferences:
 *                 type: object
 *                 description: Benutzerpräferenzen
 *               constraints:
 *                 type: object
 *                 description: Planungseinschränkungen
 *     responses:
 *       200:
 *         description: Erfolgreich generierter Plan
 *       500:
 *         description: Fehler bei der Plan-Generierung
 */

// ===============================
// 🔐 Geschützte Routen
// ===============================
router.use(protect);

// KI-Vorhersage abrufen
router.get('/forecast', aiSchedulingController.getDemandForecast);

// Schichtplanung generieren
router.post('/schedule', aiSchedulingController.generateOptimalSchedule);

// Test events route
// Enhanced test events route
router.get('/test-events', async (req, res) => {
  try {
    console.log('🧪 Testing Claude event search for Basel...');
    
    // Try to load findLocalEvents function
    let findLocalEvents;
    try {
      const locationService = require('../services/restaurantLocationService');
      findLocalEvents = locationService.findLocalEvents;
      
      if (!findLocalEvents) {
        return res.json({
          success: false,
          error: 'findLocalEvents function not found in restaurantLocationService',
          suggestion: 'Need to add event search function to the service'
        });
      }
    } catch (requireError) {
      return res.json({
        success: false,
        error: `Cannot load restaurantLocationService: ${requireError.message}`,
        suggestion: 'Check if file exists at ../services/restaurantLocationService.js'
      });
    }
    
    const testRestaurant = {
      name: "Beizli zum Löwen",
      city: "Basel",
      latitude: "47.55960000",
      longitude: "7.59000000"
    };
    
    console.log('🎪 Searching for Basel Herbstmesse and other events...');
    const events = await findLocalEvents(testRestaurant);
    
    res.json({
      success: true,
      message: 'Event search completed successfully',
      data: events,
      debug: {
        hasApiKey: true,
        model: process.env.CLAUDE_MODEL,
        eventsFound: events.totalEvents,
        restaurantLocation: testRestaurant
      }
    });
    
  } catch (error) {
    console.error('❌ Event search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});


module.exports = router;
