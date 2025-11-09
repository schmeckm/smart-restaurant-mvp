// routes/products.js
const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Verwaltung von Produkten im Restaurant (Menü- oder Lagerartikel)
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Liste aller Produkte
 *     description: Gibt alle Produkte im System zurück. Zugriff nur mit gültigem Token.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste von Produkten
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
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Nicht autorisiert – Token fehlt oder ist ungültig
 *   post:
 *     summary: Neues Produkt anlegen
 *     description: Nur für Admins und Manager erlaubt.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Produkt erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabe
 *       403:
 *         description: Zugriff verweigert
 */

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Einzelnes Produkt abrufen
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Produkt-ID
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *       404:
 *         description: Produkt nicht gefunden
 *   put:
 *     summary: Produkt aktualisieren
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Produkt erfolgreich aktualisiert
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Produkt nicht gefunden
 *   delete:
 *     summary: Produkt löschen
 *     description: Nur für Admins erlaubt.
 *     tags: [Products]
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
 *         description: Produkt erfolgreich gelöscht
 *       403:
 *         description: Zugriff verweigert
 *       404:
 *         description: Produkt nicht gefunden
 */

// ============================================================
// 🔐 Routes
// ============================================================

// Alle Abfragen nur mit Auth
router.get('/', protect, getAllProducts);
router.get('/:id', protect, getProduct);

// Admin / Manager Berechtigungen
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
