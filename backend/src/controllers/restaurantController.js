// ✅ Vollständiger Restaurant Controller (Multi-Tenant + Revenue Aggregation)

const { Restaurant, Sale, Product, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Verwaltung und Analyse von Restaurants (Mandanten)
 */

// ============================================================
// 🟢 Create Restaurant
// ============================================================
exports.createRestaurant = async (req, res) => {
  try {
    const { tenantId, name, type, address, email, phone, subscriptionPlan } = req.body;

    if (!tenantId || !name) {
      return res.status(400).json({ success: false, message: 'tenantId und name sind erforderlich.' });
    }

    const restaurant = await Restaurant.create({
      tenantId,
      name,
      type,
      address,
      email,
      phone,
      subscriptionPlan,
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('❌ Fehler beim Erstellen eines Restaurants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🟡 Get All Restaurants
// ============================================================
exports.getAllRestaurants = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const where = {};

    if (tenantId) where.tenantId = tenantId;

    const restaurants = await Restaurant.findAll({
      where,
      include: [
        { model: Product, as: 'products', attributes: ['id'] },
        { model: User, as: 'users', attributes: ['id'] },
      ],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    console.error('❌ Fehler beim Laden der Restaurants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🟠 Get Single Restaurant
// ============================================================
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'products' },
        { model: User, as: 'users' },
      ],
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant nicht gefunden.' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🔵 Update Restaurant
// ============================================================
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Restaurant.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Restaurant nicht gefunden.' });
    }

    const restaurant = await Restaurant.findByPk(id);
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🔴 Delete Restaurant
// ============================================================
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Restaurant.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Restaurant nicht gefunden.' });
    }

    res.json({ success: true, message: 'Restaurant erfolgreich gelöscht.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 📊 Get Restaurant Revenue (optional mit Zeitraum)
// ============================================================
exports.getRestaurantRevenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date('2025-01-01');
    const end = endDate ? new Date(endDate) : new Date();

    const totalRevenue = await Sale.getTotalRevenue(start, end, id);

    res.json({
      success: true,
      data: {
        restaurantId: id,
        totalRevenue,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    console.error('❌ Fehler bei Umsatzermittlung:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 🟢 Get Active Restaurants
// ============================================================
exports.getActiveRestaurants = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const activeRestaurants = await Restaurant.getActiveRestaurants(tenantId);
    res.json({ success: true, data: activeRestaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 📈 Top Performing Restaurants (Umsatzbasiert)
// ============================================================
exports.getTopPerformingRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topRestaurants = await Sale.findAll({
      attributes: [
        'restaurantId',
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total_price')), 'totalRevenue'],
      ],
      include: [{ model: Restaurant, as: 'restaurant', attributes: ['name', 'type', 'subscriptionPlan'] }],
      group: ['restaurantId', 'restaurant.id'],
      order: [[Sale.sequelize.literal('totalRevenue'), 'DESC']],
      limit: parseInt(limit),
    });

    res.json({ success: true, data: topRestaurants });
  } catch (error) {
    console.error('❌ Fehler bei Top-Restaurants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
