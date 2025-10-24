const { Sale, Product, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all sales
// @route   GET /api/v1/sales
// @access  Private
exports.getSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate,
      productId,
      userId 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (productId) {
      where.product_id = productId;
    }
    
    if (userId) {
      where.user_id = userId;
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        sales: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Verkäufe',
      error: error.message
    });
  }
};

// @desc    Get single sale
// @route   GET /api/v1/sales/:id
// @access  Private
exports.getSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Verkauf nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Verkaufs'
    });
  }
};

// @desc    Create sale
// @route   POST /api/v1/sales
// @access  Private
exports.createSale = async (req, res) => {
  try {
    const { product_id, quantity, sale_date, payment_method } = req.body;

    // Get product to calculate prices
    const product = await Product.findByPk(product_id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    // Calculate prices
    const unit_price = product.price;
    const total_price = unit_price * quantity;

    const saleData = {
      product_id,
      user_id: req.user.id,
      quantity,
      unit_price,
      total_price,
      payment_method: payment_method || 'cash',
      sale_date: sale_date || new Date()
    };

    const sale = await Sale.create(saleData);

    // Fetch complete sale with relations
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Verkauf erfolgreich erstellt',
      data: completeSale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Verkaufs',
      error: error.message
    });
  }
};

// @desc    Update sale
// @route   PUT /api/v1/sales/:id
// @access  Private (admin, manager)
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Verkauf nicht gefunden'
      });
    }

    const { product_id, quantity, payment_method, status, sale_date } = req.body;

    // If product or quantity changed, recalculate prices
    if (product_id || quantity) {
      const productIdToUse = product_id || sale.product_id;
      const quantityToUse = quantity || sale.quantity;
      
      const product = await Product.findByPk(productIdToUse);
      if (product) {
        sale.unit_price = product.price;
        sale.total_price = product.price * quantityToUse;
      }
    }

    // Update fields
    if (product_id) sale.product_id = product_id;
    if (quantity) sale.quantity = quantity;
    if (payment_method) sale.payment_method = payment_method;
    if (status) sale.status = status;
    if (sale_date) sale.sale_date = sale_date;

    await sale.save();

    // Fetch updated sale with relations
    const updatedSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      message: 'Verkauf aktualisiert',
      data: updatedSale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Verkaufs',
      error: error.message
    });
  }
};

// @desc    Delete sale
// @route   DELETE /api/v1/sales/:id
// @access  Private (admin)
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
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
    console.error('Delete sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Verkaufs',
      error: error.message
    });
  }
};

// @desc    Get sales analytics
// @route   GET /api/v1/sales/analytics
// @access  Private (admin, manager)
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const totalSales = await Sale.sum('total_price', { where });
    const salesCount = await Sale.count({ where });
    
    res.json({
      success: true,
      data: {
        totalSales: totalSales || 0,
        salesCount: salesCount || 0,
        averageSale: salesCount > 0 ? (totalSales / salesCount).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Analytics'
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/v1/sales/top-products
// @access  Private (admin, manager)
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const topProducts = await Sale.findAll({
      where,
      attributes: [
        'product_id',
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('quantity')), 'totalQuantity'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total_price')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price']
        }
      ],
      group: ['product_id', 'product.id', 'product.name', 'product.price'],
      order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Top-Produkte'
    });
  }
};

// @desc    Get daily sales
// @route   GET /api/v1/sales/daily
// @access  Private (admin, manager)
exports.getDailySales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const dailySales = await Sale.findAll({
      where,
      attributes: [
        [Sale.sequelize.fn('DATE', Sale.sequelize.col('sale_date')), 'date'],
        [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'count'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total_price')), 'total']
      ],
      group: [Sale.sequelize.fn('DATE', Sale.sequelize.col('sale_date'))],
      order: [[Sale.sequelize.fn('DATE', Sale.sequelize.col('sale_date')), 'ASC']]
    });

    res.json({
      success: true,
      data: dailySales
    });
  } catch (error) {
    console.error('Get daily sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der täglichen Verkäufe'
    });
  }
};