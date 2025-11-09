// backend/src/routes/nutrition.js
const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Nutrition
 *   description: Endpoints zur Berechnung und Verwaltung von Nährwerten (inkl. AI-Fallback)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Nutrition:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         entityType:
 *           type: string
 *           example: ingredient
 *         entityId:
 *           type: string
 *           format: uuid
 *         calories:
 *           type: number
 *           example: 42.5
 *         protein:
 *           type: number
 *           example: 3.2
 *         fat:
 *           type: number
 *           example: 0.8
 *         carbohydrates:
 *           type: number
 *           example: 9.4
 *         fiber:
 *           type: number
 *           example: 1.1
 *         sugar:
 *           type: number
 *           example: 5.6
 *         nutritionSource:
 *           type: string
 *           example: ai-claude
 */

// 🔐 Alle Nutrition-Routen sind geschützt
router.use(protect);

/**
 * @swagger
 * /api/v1/nutrition:
 *   get:
 *     summary: Alle Nährwert-Einträge abrufen
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Nährwerte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Nutrition'
 */
router.get('/', nutritionController.getAll);

/**
 * @swagger
 * /api/v1/nutrition:
 *   post:
 *     summary: Neuen Nährwert-Eintrag erstellen
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Nutrition'
 *     responses:
 *       201:
 *         description: Nährwert erfolgreich erstellt
 */
router.post('/', nutritionController.create);

/**
 * @swagger
 * /api/v1/nutrition/{id}:
 *   get:
 *     summary: Einzelnen Nährwert-Eintrag abrufen
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Nährwert-Eintrag gefunden
 *       404:
 *         description: Eintrag nicht gefunden
 */
router.get('/:id', nutritionController.getById);

/**
 * @swagger
 * /api/v1/nutrition/{id}:
 *   put:
 *     summary: Nährwert-Eintrag aktualisieren
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Nutrition'
 *     responses:
 *       200:
 *         description: Erfolgreich aktualisiert
 *       404:
 *         description: Eintrag nicht gefunden
 */
router.put('/:id', nutritionController.update);

/**
 * @swagger
 * /api/v1/nutrition/{id}:
 *   delete:
 *     summary: Nährwert-Eintrag löschen
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Erfolgreich gelöscht
 *       404:
 *         description: Eintrag nicht gefunden
 */
router.delete('/:id', nutritionController.delete);

/**
 * @swagger
 * /api/v1/nutrition/ingredient/{id}:
 *   get:
 *     summary: Liefert Nährwerte für eine Zutat (mit Claude KI-Fallback)
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID der Zutat (Ingredient)
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Nährwertdaten
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 source:
 *                   type: string
 *                   example: ai-claude
 *                 data:
 *                   $ref: '#/components/schemas/Nutrition'
 *       404:
 *         description: Ingredient nicht gefunden
 *       500:
 *         description: Serverfehler oder AI-Service nicht erreichbar
 */
router.get('/ingredient/:id', nutritionController.getByIngredient);

/**
 * @swagger
 * /api/v1/nutrition/product/{id}:
 *   get:
 *     summary: Liefert Nährwerte für ein Produkt (mit Claude KI-Fallback)
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID des Produkts
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Nährwertdaten
 *       404:
 *         description: Produkt nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.get('/product/:id', nutritionController.getByProduct);


/**
 * @swagger
 * /api/v1/nutrition/bulk-status:
 *   post:
 *     summary: Prüft Nährwerte-Status für mehrere Entities
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               entityType:
 *                 type: string
 *                 example: ingredient
 *     responses:
 *       200:
 *         description: Status-Map für alle angefragten Entities
 *       400:
 *         description: Ungültige Anfrage
 */
router.post('/bulk-status', nutritionController.checkBulkStatus);


module.exports = router;