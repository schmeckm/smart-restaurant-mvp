// routes/categories.js
const express = require('express');
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Verwaltung von Produktkategorien
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Liste aller Kategorien
 *     description: Gibt alle Kategorien zurück (nur mit gültigem Token zugänglich)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit einer Liste von Kategorien
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
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Nicht autorisiert – Token fehlt oder ungültig
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Kategorie anhand der ID abrufen
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Kategorie
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *       404:
 *         description: Kategorie nicht gefunden
 */

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Neue Kategorie erstellen
 *     description: Nur für Admins oder Manager erlaubt
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Kategorie erfolgreich erstellt
 *       403:
 *         description: Zugriff verweigert
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Kategorie aktualisieren
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Kategorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich aktualisiert
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Kategorie nicht gefunden
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Kategorie löschen
 *     description: Nur für Admins erlaubt
 *     tags: [Categories]
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
 *         description: Kategorie erfolgreich gelöscht
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Kategorie nicht gefunden
 */

// ============================================================
// 🔐 Routes
// ============================================================

// Public (mit Token)
router.get('/', protect, getAllCategories);
router.get('/:id', protect, getCategory);

// Admin/Manager only
router.post('/', protect, authorize('admin', 'manager'), createCategory);
router.put('/:id', protect, authorize('admin', 'manager'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
