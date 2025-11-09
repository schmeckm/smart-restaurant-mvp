// backend/src/routes/recipes.js
// Complete Recipe Routes with AI Integration + Swagger Docs

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recipeController = require('../controllers/recipeController');
const aiRecipeController = require('../controllers/aiRecipeController');

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Verwaltung von Rezepten & KI-Integration (Claude/GPT)
 */

/**
 * @swagger
 * /api/v1/recipes/generate-with-ai:
 *   post:
 *     summary: Rezept mit KI generieren
 *     description: Nutzt Claude AI / GPT, um ein komplettes Rezept basierend auf Eingabeparametern zu erstellen.
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Kreiere ein italienisches Pasta-Rezept mit Tomaten und Basilikum"
 *     responses:
 *       200:
 *         description: Erfolgreich – Rezept wurde durch KI generiert
 *       401:
 *         description: Nicht autorisiert
 */

/**
 * @swagger
 * /api/v1/recipes/save-ai-recipe:
 *   post:
 *     summary: KI-Rezept speichern
 *     description: Speichert ein durch KI generiertes Rezept inklusive Zutaten in der Datenbank.
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201:
 *         description: KI-Rezept erfolgreich gespeichert
 *       400:
 *         description: Ungültige Eingabe
 */

/**
 * @swagger
 * /api/v1/recipes/analyze-nutrition:
 *   post:
 *     summary: Nährwerte analysieren
 *     description: Berechnet Nährwertinformationen (Kalorien, Proteine, etc.) basierend auf den Zutaten.
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "Tomaten 200 g"
 *     responses:
 *       200:
 *         description: Analyse erfolgreich – Nährwerte werden zurückgegeben
 */

/**
 * @swagger
 * /api/v1/recipes/suggest-ingredients:
 *   post:
 *     summary: Zutaten-Vorschläge mit KI
 *     description: Gibt basierend auf vorhandenen Zutaten oder einem Gerichtsvorschlag smarte KI-Empfehlungen.
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentIngredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "Pasta"
 *     responses:
 *       200:
 *         description: Erfolgreich – Zutatenvorschläge generiert
 */

/**
 * @swagger
 * /api/v1/recipes:
 *   get:
 *     summary: Alle Rezepte abrufen
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste von Rezepten
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *   post:
 *     summary: Neues Rezept erstellen
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201:
 *         description: Rezept erfolgreich erstellt
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *       404:
 *         description: Nicht gefunden
 *   put:
 *     summary: Rezept aktualisieren
 *     tags: [Recipes]
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
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Erfolgreich aktualisiert
 *   delete:
 *     summary: Rezept löschen
 *     tags: [Recipes]
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
 *         description: Erfolgreich gelöscht
 */

// ============================================================
// 🔐 Authentication required
// ============================================================
router.use(protect);

// ===== AI Recipe Routes =====
router.post('/generate-with-ai', aiRecipeController.generateRecipeWithAI);
router.post('/save-ai-recipe', aiRecipeController.saveAIRecipe);
router.post('/analyze-nutrition', aiRecipeController.analyzeNutrition);
router.post('/suggest-ingredients', aiRecipeController.suggestIngredients);
router.get('/product/:productId', recipeController.getRecipeByProduct);

// ===== Standard CRUD Routes =====
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipe);
router.post('/', recipeController.createRecipe);
router.put('/:id', recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;
