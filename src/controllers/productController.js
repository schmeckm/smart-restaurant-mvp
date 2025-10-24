// backend/src/controllers/productController.js
const { Product } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, is_available } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (category) {
      where.category = category;
    }

    if (is_available !== undefined) {
      where.is_available = is_available === 'true';
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products: rows,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        total: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/v1/products
// @access  Private (admin/manager)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, price, cost, description, is_available } = req.body;

    const product = await Product.create({
      name,
      category,
      price,
      cost,
      description,
      is_available
    });

    res.status(201).json({
      success: true,
      message: 'Produkt erstellt',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (admin/manager)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.update(req.body);

    res.json({
      success: true,
      message: 'Produkt aktualisiert',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Produkt gelöscht'
    });
  } catch (error) {
    next(error);
  }
};