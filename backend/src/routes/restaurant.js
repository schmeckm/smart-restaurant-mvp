// backend/src/routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Verwaltung der Restaurants (Mandanten)
 */

// ============================================================
// 🔹 GET: Alle Restaurants (optional Tenant-Filter)
// ============================================================
/**
 * @swagger
 * /api/v1/restaurants:
 *   get:
 *     summary: Liste aller Restaurants (optional gefiltert nach Tenant)
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Optional – zeigt nur Restaurants eines Tenants
 *     responses:
 *       200:
 *         description: Erfolgreich geladen
 */
router.get('/', restaurantController.getAllRestaurants);

// ============================================================
// 🔹 POST: Neues Restaurant erstellen
// ============================================================
/**
 * @swagger
 * /api/v1/restaurants:
 *   post:
 *     summary: Erstellt ein neues Restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 */
router.post('/', restaurantController.createRestaurant);

// ============================================================
// 🔹 Custom Routes (müssen VOR /:id stehen!)
// ============================================================
router.get('/active/list', restaurantController.getActiveRestaurants);
router.get('/analytics/top', restaurantController.getTopPerformingRestaurants);

// ============================================================
// 🔹 Umsatz eines Restaurants
// ============================================================
router.get('/:id/revenue', restaurantController.getRestaurantRevenue);

// ============================================================
// 🔹 Ein einzelnes Restaurant
// ============================================================
/**
 * @swagger
 * /api/v1/restaurants/{id}:
 *   get:
 *     summary: Holt ein einzelnes Restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erfolgreich gefunden
 */
router.get('/:id', restaurantController.getRestaurantById);

// ============================================================
// 🔹 Update Restaurant
// ============================================================
/**
 * @swagger
 * /api/v1/restaurants/{id}:
 *   put:
 *     summary: Aktualisiert ein Restaurant
 *     tags: [Restaurants]
 */
router.put('/:id', restaurantController.updateRestaurant);

// ============================================================
// 🔹 Delete Restaurant
// ============================================================
/**
 * @swagger
 * /api/v1/restaurants/{id}:
 *   delete:
 *     summary: Löscht ein Restaurant
 *     tags: [Restaurants]
 */
router.delete('/:id', restaurantController.deleteRestaurant);

module.exports = router;
