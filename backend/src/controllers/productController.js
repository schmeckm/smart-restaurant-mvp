// backend/src/controllers/productController.js
const { Product, Category, Ingredient, ProductIngredient, Nutrition } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
exports.getAllProducts = async (req, res) => {
  try {
    console.log('🧩 [DEBUG] req.user =', req.user);

    const products = await Product.findAll({
      where: { 
        restaurantId: req.user?.restaurantId, // ✅ FIXED
        isActive: true
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] },
        { model: Ingredient, as: 'ingredients', through: { attributes: ['quantity', 'unit'] }, attributes: ['id', 'name', 'unit'] }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('❌ [BACKEND ERROR] Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Produkte',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.user.restaurantId  // ✅ FIXED
      },
      include: [
        { model: Category, as: 'category' },
        { 
          model: Ingredient,
          as: 'ingredients',
          through: { 
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional', 'sortOrder'] 
          }
        },
        { model: Nutrition, as: 'nutrition' }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Produkts',
      error: error.message
    });
  }
};

// @desc    Create product
// @route   POST /api/v1/products
// @access  Private (admin/manager)
exports.createProduct = async (req, res) => {
  try {
    console.log('🧩 Creating product for user:', req.user);

    const productData = {
      ...req.body,
      restaurantId: req.user.restaurantId, // ✅ FIXED
      isActive: req.body.isActive ?? true
    };

    const product = await Product.create(productData);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Produkts',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (admin/manager)
exports.updateProduct = async (req, res) => {
  try {
    console.log('🧩 Update product request:', req.params.id, req.user);

    const product = await Product.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId  // ✅ FIXED
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.update(req.body);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Produkts',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        restaurantId: req.user.restaurantId  // ✅ FIXED
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.update({ isActive: false }); // Soft delete

    res.json({
      success: true,
      message: 'Produkt erfolgreich gelöscht',
      data: {}
    });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Produkts',
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/v1/products/category/:categoryId
// @access  Private
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        categoryId: req.params.categoryId,
        restaurantId: req.user.restaurantId,  // ✅ FIXED
        isActive: true 
      },
      include: [{ model: Category, as: 'category' }],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('❌ Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Produkte',
      error: error.message
    });
  }
};
