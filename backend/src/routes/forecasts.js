// backend/src/routes/forecasts.js
const express = require('express');
const router = express.Router();
const {
  getForecastVersions,
  getForecastVersion,
  createForecastVersion,
  updateForecastVersion,
  deleteForecastVersion,
  cloneForecastVersion
} = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Forecasts
 *   description: Verwaltung von Forecast-Versionen (Planungsdaten)
 */

/**
 * @swagger
 * /api/v1/forecasts:
 *   get:
 *     summary: Liste aller Forecast-Versionen
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste von Forecast-Versionen wird zurückgegeben
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Forecast'
 *       401:
 *         description: Nicht autorisiert – Token fehlt oder ist ungültig
 *   post:
 *     summary: Neue Forecast-Version anlegen
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Forecast'
 *     responses:
 *       201:
 *         description: Forecast-Version erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabe
 */

/**
 * @swagger
 * /api/v1/forecasts/{id}:
 *   get:
 *     summary: Einzelne Forecast-Version abrufen
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID der Forecast-Version
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *       404:
 *         description: Forecast-Version nicht gefunden
 *   put:
 *     summary: Forecast-Version aktualisieren
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Forecast'
 *     responses:
 *       200:
 *         description: Erfolgreich aktualisiert
 *       404:
 *         description: Forecast-Version nicht gefunden
 *   delete:
 *     summary: Forecast-Version löschen
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Forecast-Version erfolgreich gelöscht
 *       404:
 *         description: Forecast-Version nicht gefunden
 */

/**
 * @swagger
 * /api/v1/forecasts/{id}/clone:
 *   post:
 *     summary: Forecast-Version duplizieren
 *     description: Erstellt eine Kopie einer bestehenden Forecast-Version
 *     tags: [Forecasts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Forecast-Version, die dupliziert werden soll
 *     responses:
 *       201:
 *         description: Forecast-Version erfolgreich dupliziert
 *       404:
 *         description: Forecast-Version nicht gefunden
 */

// ============================================================
// 🔐 Alle Forecast-Routen sind geschützt
// ============================================================
router.use(protect);

// CRUD Forecast Routes
router.route('/')
  .get(getForecastVersions)
  .post(createForecastVersion);

router.route('/:id')
  .get(getForecastVersion)
  .put(updateForecastVersion)
  .delete(deleteForecastVersion);

// Klon-Route
router.post('/:id/clone', cloneForecastVersion);

module.exports = router;
