// backend/src/routes/recipes.js
// Recipe Routes - Maps to Products (Recipes = Products with instructions)

const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');

// ==========================================================
// 🔒 Alle Routen erfordern Authentifizierung (JWT Token)
// ==========================================================
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Verwaltung von Rezepten (Produkten mit Zutaten und Anweisungen)
 */

/**
 * @swagger
 * /api/v1/recipes:
 *   get:
 *     summary: Liste aller Rezepte abrufen
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste der Rezepte
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
 *     summary: Neues Rezept anlegen
 *     tags: [Recipes]
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
 *         description: Rezept erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */

/**
 * @swagger
 * /api/v1/recipes/{id}:
 *   get:
 *     summary: Einzelnes Rezept abrufen
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID des Rezepts
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Rezept nicht gefunden
 *   put:
 *     summary: Rezept aktualisieren
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID des Rezepts
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
 *         description: Rezept erfolgreich aktualisiert
 *       404:
 *         description: Rezept nicht gefunden
 *   delete:
 *     summary: Rezept löschen
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID des Rezepts
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rezept erfolgreich gelöscht
 *       404:
 *         description: Rezept nicht gefunden
 */

// ==========================================================
// 🔧 ROUTE HANDLERS
// ==========================================================

router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipe);
router.post('/', recipeController.createRecipe);
router.put('/:id', recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;
