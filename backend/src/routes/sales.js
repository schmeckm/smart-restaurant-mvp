// backend/src/routes/sales.js
const express = require('express');
const {
  getAllSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getSalesAnalytics,
  getTopProducts,
  getDailySales
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Verwaltung von Verkaufsdaten, Umsätzen und Analytics
 */

/**
 * @swagger
 * /api/v1/sales:
 *   get:
 *     summary: Alle Verkäufe abrufen
 *     description: Gibt alle Verkäufe des angemeldeten Restaurants zurück (tenant-basiert).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter – Startdatum
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter – Enddatum
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter – Status des Verkaufs
 *     responses:
 *       200:
 *         description: Liste aller Verkäufe
 *       401:
 *         description: Nicht autorisiert
 *   post:
 *     summary: Neuen Verkauf erfassen
 *     description: Erstellt einen neuen Verkaufseintrag für das aktuelle Restaurant.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       201:
 *         description: Verkauf erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabe
 */

/**
 * @swagger
 * /api/v1/sales/{id}:
 *   get:
 *     summary: Einzelnen Verkauf abrufen
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID des Verkaufs
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *       404:
 *         description: Verkauf nicht gefunden
 *   put:
 *     summary: Verkauf aktualisieren
 *     description: Nur für Manager oder Admins erlaubt.
 *     tags: [Sales]
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
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       200:
 *         description: Verkauf erfolgreich aktualisiert
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Verkauf nicht gefunden
 *   delete:
 *     summary: Verkauf löschen
 *     description: Nur für Admins erlaubt.
 *     tags: [Sales]
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
 *         description: Verkauf erfolgreich gelöscht
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Verkauf nicht gefunden
 */

/**
 * @swagger
 * /api/v1/sales/analytics:
 *   get:
 *     summary: Umsatzanalyse abrufen
 *     description: Gibt aggregierte Verkaufsdaten für Diagramme oder Berichte zurück.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Analytics-Daten zurückgegeben
 *       403:
 *         description: Zugriff verweigert
 */

/**
 * @swagger
 * /api/v1/sales/top-products:
 *   get:
 *     summary: Top-Produkte nach Umsatz oder Absatz
 *     description: Gibt die meistverkauften Produkte nach Menge oder Umsatz zurück.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste der Top-Produkte
 *       403:
 *         description: Zugriff verweigert
 */

/**
 * @swagger
 * /api/v1/sales/daily:
 *   get:
 *     summary: Tägliche Umsatzübersicht
 *     description: Gibt den täglichen Umsatzverlauf für das aktuelle Restaurant zurück.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Tagesumsätze zurückgegeben
 *       403:
 *         description: Zugriff verweigert
 */

// ============================================================
// 🔐 Routes mit Authentifizierung & Rollen
// ============================================================

// Analytics-Routen
router.get('/analytics', protect, authorize('admin', 'manager'), getSalesAnalytics);
router.get('/top-products', protect, authorize('admin', 'manager'), getTopProducts);
router.get('/daily', protect, authorize('admin', 'manager'), getDailySales);

// CRUD-Routen
router.get('/', protect, getAllSales);
router.get('/:id', protect, getSale);
router.post('/', protect, createSale);
router.put('/:id', protect, authorize('admin', 'manager'), updateSale);
router.delete('/:id', protect, authorize('admin'), deleteSale);

module.exports = router;
