// backend/src/controllers/salesController.js
const { Sale, Product, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Verwaltung von Verkaufsdaten und Umsatzanalysen
 */

// ============================================================
// 🔹 GET /api/v1/sales – Alle Verkäufe abrufen (tenant-basiert)
// ============================================================
// backend/src/controllers/saleController.js

exports.getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where = {
      restaurantId: req.user.restaurantId
    };

    if (startDate && endDate) {
      where.sale_date = { [Op.between]: [startDate, endDate] };
    }

    if (status) {
      where.status = status;
    }

    const sales = await Sale.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price'] },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'] // ✅ fix: kein first_name/last_name
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    const safeSales = sales.map(s => ({
      ...s.toJSON(),
      status: s.status || 'pending',
      total_price: s.total_price || (s.quantity * s.unit_price)
    }));

    res.json({
      success: true,
      count: safeSales.length,
      data: safeSales
    });
  } catch (error) {
    console.error('❌ [getAllSales] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verkäufe',
      error: error.message
    });
  }
};


// ============================================================
// 🔹 GET /api/v1/sales/:id – Einzelnen Verkauf abrufen
// ============================================================
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      where: { id: req.params.id, restaurantId: req.user.restaurantId },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price'] },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Verkauf nicht gefunden'
      });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('❌ [getSale] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Verkaufs',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 POST /api/v1/sales – Neuen Verkauf erfassen
// ============================================================
exports.createSale = async (req, res) => {
  try {
    const { product_id, quantity, payment_method, unit_price } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Produkt und Menge sind erforderlich'
      });
    }

    const product = await Product.findOne({
      where: { id: product_id, restaurantId: req.user.restaurantId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden oder gehört zu anderem Restaurant'
      });
    }

    const sale = await Sale.create({
      productId: product.id,
      restaurantId: req.user.restaurantId,
      userId: req.user.id,
      quantity,
      payment_method: payment_method || 'cash',
      unitPrice: unit_price || product.price || 0,
      totalPrice: (unit_price || product.price || 0) * quantity,
      status: req.body.status || 'pending',
      saleDate: new Date()
    });

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('❌ [createSale] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erfassen des Verkaufs',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 PUT /api/v1/sales/:id – Verkauf aktualisieren
// ============================================================
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      where: { id: req.params.id, restaurantId: req.user.restaurantId }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Verkauf nicht gefunden'
      });
    }

    await sale.update({
      ...req.body,
      status: req.body.status || sale.status || 'pending'
    });

    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('❌ [updateSale] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Verkaufs',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 DELETE /api/v1/sales/:id – Verkauf löschen
// ============================================================
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      where: { id: req.params.id, restaurantId: req.user.restaurantId }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Verkauf nicht gefunden'
      });
    }

    await sale.destroy();

    res.json({
      success: true,
      message: 'Verkauf gelöscht'
    });
  } catch (error) {
    console.error('❌ [deleteSale] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Verkaufs',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 GET /api/v1/sales/analytics – Umsatzanalyse
// ============================================================
/**
 * @swagger
 * /api/v1/sales/analytics:
 *   get:
 *     summary: Umsatzanalyse abrufen
 *     description: Aggregierte Statistiken über alle Verkäufe (z. B. Gesamtumsatz, durchschnittlicher Bestellwert)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Analytics-Daten zurückgegeben
 */
exports.getSalesAnalytics = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { startDate, endDate } = req.query;

    const where = { restaurantId };
    if (startDate && endDate) {
      where.saleDate = { [Op.between]: [startDate, endDate] };
    }

    const totalRevenue = await Sale.sum('totalPrice', { where });
    const totalSales = await Sale.count({ where });
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    res.json({
      success: true,
      data: { totalRevenue, totalSales, avgOrderValue }
    });
  } catch (error) {
    console.error('❌ [getSalesAnalytics] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Analytics',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 GET /api/v1/sales/top-products – Meistverkaufte Produkte
// ============================================================
/**
 * @swagger
 * /api/v1/sales/top-products:
 *   get:
 *     summary: Top-Produkte nach Umsatz oder Absatz
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich – Liste der Top-Produkte
 */
exports.getTopProducts = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const results = await Sale.findAll({
      where: { restaurantId },
      attributes: [
        'productId',
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('quantity')), 'totalQuantity'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total_price')), 'totalRevenue']
      ],
      include: [
        {
          model: Sale.sequelize.models.Product,
          as: 'product',
          attributes: ['name', 'price']
        }
      ],
      group: ['productId', 'product.id'],
      order: [[Sale.sequelize.literal('totalRevenue'), 'DESC']],
      limit: 10
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('❌ [getTopProducts] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Top-Produkte',
      error: error.message
    });
  }
};

// ============================================================
// 🔹 GET /api/v1/sales/daily – Tagesumsätze
// ============================================================
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
 */
exports.getDailySales = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const results = await Sale.findAll({
      where: { restaurantId },
      attributes: [
        [Sale.sequelize.fn('DATE', Sale.sequelize.col('sale_date')), 'date'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total_price')), 'dailyRevenue']
      ],
      group: ['date'],
      order: [[Sale.sequelize.literal('date'), 'ASC']]
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ [getDailySales] Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Tagesumsätze',
      error: error.message
    });
  }
};
